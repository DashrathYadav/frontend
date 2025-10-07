import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import { tenantApi, lookupApi } from '../../services/api';
import { TenantSearchRequest } from '../../types';
import ListPageWrapper from '../../components/ListPageWrapper';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';

const TenantsList: React.FC = () => {
  const { t } = useTranslation();
  const [urlParams] = useSearchParams();

  // Use enhanced pagination hook
  const {
    pagination,
    filters,
    searchTrigger,
    handlePageChange,
    handlePageSizeChange,
    handleSearchTermChange,
    handleSearch,
    handleFilterChange,
    handleClearFilters,
    updatePaginationData,
    getSearchParams,
    hasActiveFilters
  } = useEnhancedPagination({
    initialPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48]
  });

  // Track if initial URL parameters have been processed
  const [initialUrlParamsProcessed, setInitialUrlParamsProcessed] = React.useState(false);

  // Set initial filters from URL params
  React.useEffect(() => {
    const ownerId = urlParams.get('ownerId');
    const propertyId = urlParams.get('propertyId');
    const roomId = urlParams.get('roomId');

    console.log('URL params - ownerId:', ownerId, 'propertyId:', propertyId, 'roomId:', roomId);

    if (ownerId) {
      console.log('Setting ownerId filter:', ownerId);
      handleFilterChange('ownerId', ownerId);
    }
    if (propertyId) {
      console.log('Setting propertyId filter:', propertyId);
      handleFilterChange('propertyId', propertyId);
    }
    if (roomId) {
      console.log('Setting roomId filter:', roomId);
      handleFilterChange('roomId', roomId);
    }

    setInitialUrlParamsProcessed(true);
  }, [urlParams, handleFilterChange]);

  // Fetch lookup data with error handling
  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: async () => {
      try {
        const result = await lookupApi.getOwners();
        console.log('Owners lookup response:', result);
        return result;
      } catch (error) {
        console.warn('Failed to load owners lookup:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const { data: properties } = useQuery({
    queryKey: ['properties-lookup', urlParams.get('ownerId'), filters.filterValues.ownerId],
    queryFn: async () => {
      try {
        // Use URL param first, then fall back to filter value
        const ownerIdParam = urlParams.get('ownerId');
        const ownerIdFilter = filters.filterValues.ownerId;
        const ownerId = ownerIdParam || (ownerIdFilter && ownerIdFilter !== 'all' ? ownerIdFilter : undefined);

        const ownerIdNumber = ownerId ? Number(ownerId) : undefined;
        console.log('Fetching properties for ownerId:', ownerIdNumber, '(from URL:', ownerIdParam, ', from filter:', ownerIdFilter, ')');
        const result = await lookupApi.getProperties(ownerIdNumber);
        console.log('Properties lookup response:', result);
        return result;
      } catch (error) {
        console.warn('Failed to load properties lookup:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: true, // Always enable this query
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-lookup', urlParams.get('propertyId'), filters.filterValues.propertyId],
    queryFn: async () => {
      try {
        // Use URL param first, then fall back to filter value
        const propertyIdParam = urlParams.get('propertyId');
        const propertyIdFilter = filters.filterValues.propertyId;
        const propertyId = propertyIdParam || (propertyIdFilter && propertyIdFilter !== 'all' ? propertyIdFilter : undefined);

        const propertyIdNumber = propertyId ? Number(propertyId) : undefined;
        console.log('Fetching rooms for propertyId:', propertyIdNumber, '(from URL:', propertyIdParam, ', from filter:', propertyIdFilter, ')');
        const result = await lookupApi.getRoomsByProperty(propertyIdNumber!);
        console.log('Rooms lookup response:', result);
        return result;
      } catch (error) {
        console.warn('Failed to load rooms lookup:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: true, // Always enable this query
  });

  // Fetch tenants with enhanced pagination
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useQuery({
    queryKey: ['tenants', searchTrigger, getSearchParams()],
    queryFn: async () => {
      try {
        const searchParams = getSearchParams() as TenantSearchRequest;
        console.log('Search params being sent:', searchParams);
        console.log('Current filter values:', filters.filterValues);
        const result = await tenantApi.search(searchParams);
        console.log('Tenants API response:', result);
        return result;
      } catch (error) {
        console.error('Tenants API error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (tenantsData) {
      updatePaginationData({
        pageNumber: tenantsData.pageNumber,
        pageSize: tenantsData.pageSize,
        totalPages: tenantsData.totalPages,
        totalRecords: tenantsData.totalRecords,
        hasNextPage: tenantsData.hasNextPage,
        hasPreviousPage: tenantsData.hasPreviousPage
      });
    }
  }, [tenantsData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (tenantsError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [tenantsError, pagination.pageSize, updatePaginationData]);

  // Prepare filter options with safe fallbacks
  const filterOptions = [
    {
      key: 'ownerId',
      label: t('properties.owner'),
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: t('tenants.selectOwner')
    },
    {
      key: 'propertyId',
      label: t('rooms.property'),
      options: properties?.data?.map(property => ({
        value: property.id.toString(),
        label: property.value
      })) || [],
      placeholder: t('rooms.selectProperty')
    },
    {
      key: 'roomId',
      label: t('tenants.room'),
      options: rooms?.data?.map(room => ({
        value: room.id.toString(),
        label: room.value
      })) || [],
      placeholder: t('tenants.selectRoom')
    },
    {
      key: 'isActive',
      label: t('common.status'),
      options: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') }
      ],
      placeholder: t('properties.selectStatus')
    }
  ];

  // Initialize filter values with 'all' to prevent empty string issues
  React.useEffect(() => {
    // Only initialize if no URL parameters are present and initial URL params have been processed
    const hasUrlParams = urlParams.get('ownerId') || urlParams.get('propertyId') || urlParams.get('roomId');

    if (filterOptions.length > 0 && Object.keys(filters.filterValues).length === 0 && !hasUrlParams && initialUrlParamsProcessed) {
      filterOptions.forEach(filter => {
        handleFilterChange(filter.key, 'all');
      });
    }
  }, [filterOptions, filters.filterValues, handleFilterChange, urlParams, initialUrlParamsProcessed]);

  // Trigger initial search when component mounts
  React.useEffect(() => {
    handleSearch();
  }, []); // Only run once on mount

  // Debug filter changes
  React.useEffect(() => {
    console.log('Filter values changed:', filters.filterValues);
  }, [filters.filterValues]);

  // Show error only for tenants loading, not for lookups
  if (tenantsError) {
    return <ErrorMessage message={t('tenants.errorLoading')} />;
  }

  const tenants = tenantsData?.data || [];

  return (
    <ListPageWrapper
      title={t('tenants.title')}
      subtitle={t('tenants.manageDescription')}
      addButtonText={t('tenants.add')}
      addButtonUrl="/tenants/new"
      isLoading={tenantsLoading}
      error={tenantsError}
      data={tenants}
      totalRecords={pagination.totalRecords}
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      pageSize={pagination.pageSize}
      hasNextPage={pagination.hasNextPage}
      hasPreviousPage={pagination.hasPreviousPage}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      onSearchChange={handleSearchTermChange}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      searchTerm={filters.searchTerm}
      filterValues={filters.filterValues}
      filters={filterOptions}
      placeholder={t('tenants.searchPlaceholder')}
      emptyStateIcon={UserCheck}
      emptyStateTitle={t('tenants.noTenantsFound')}
      emptyStateMessage={t('tenants.getStarted')}
      hasActiveFilters={hasActiveFilters}
    >

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tenants.map((tenant) => {
          const cardItem: EntityCardItem = {
            id: tenant.tenantId,
            title: tenant.tenantName,
            subtitle: tenant.tenantEmail || t('tenants.noEmailAvailable'),
            viewUrl: `/tenants/${tenant.tenantId}`,
            editUrl: `/tenants/${tenant.tenantId}/edit`,
            badges: [
              {
                label: t('tenants.tenant'),
                variant: 'secondary' as const
              }
            ],
            details: [
              {
                icon: <Mail className="w-4 h-4" />,
                label: t('tenants.email'),
                value: tenant.tenantEmail || t('tenants.noEmail')
              },
              {
                icon: <Phone className="w-4 h-4" />,
                label: t('tenants.mobile'),
                value: tenant.tenantMobile
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: t('tenants.lockInPeriod'),
                value: tenant.lockInPeriod
              }
            ],
            footerStatus: {
              label: tenant.isActive ? t('common.active') : t('common.inactive'),
              variant: tenant.isActive ? 'default' as const : 'destructive' as const
            },
            footerActions: []
          };

          return (
            <EntityCard
              key={tenant.tenantId}
              item={cardItem}
            />
          );
        })}
      </div>
    </ListPageWrapper>
  );
};

export default TenantsList;