import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Calendar, UserCheck, Eye, Edit } from 'lucide-react';
import { tenantApi, lookupApi } from '../../services/api';
import { TenantSearchRequest } from '../../types';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
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

  // Define table columns
  const columns: DataTableColumn<typeof tenants[0]>[] = [
    {
      key: 'tenantName',
      label: t('tenants.name'),
      sortable: true,
      render: (tenant) => (
        <div className="font-medium text-gray-900">{tenant.tenantName}</div>
      ),
    },
    {
      key: 'tenantEmail',
      label: t('tenants.email'),
      render: (tenant) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span>{tenant.tenantEmail || t('tenants.noEmail')}</span>
        </div>
      ),
    },
    {
      key: 'tenantMobile',
      label: t('tenants.mobile'),
      render: (tenant) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{tenant.tenantMobile}</span>
        </div>
      ),
    },
    {
      key: 'lockInPeriod',
      label: t('tenants.lockInPeriod'),
      align: 'center',
      render: (tenant) => (
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{tenant.lockInPeriod}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: t('common.status'),
      align: 'center',
      render: (tenant) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {tenant.isActive ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof tenants[0]>[] = [
    {
      label: t('common.view'),
      icon: <Eye className="h-4 w-4" />,
      href: (tenant) => `/tenants/${tenant.tenantId}`,
      variant: 'ghost',
    },
    {
      label: t('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      href: (tenant) => `/tenants/${tenant.tenantId}/edit`,
      variant: 'ghost',
    },
  ];

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
      <DataTable
        data={tenants}
        columns={columns}
        actions={actions}
        getRowId={(tenant) => tenant.tenantId.toString()}
        emptyMessage={t('tenants.noTenantsFound')}
        hoverable
      />
    </ListPageWrapper>
  );
};

export default TenantsList;