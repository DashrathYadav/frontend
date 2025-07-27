import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Calendar, Receipt, Eye } from 'lucide-react';
import { rentTrackApi, lookupApi } from '../../services/api';
import { RentTrackSearchRequest } from '../../types';
import { formatDate, formatCurrency } from '../../utils';
import ListPageWrapper from '../../components/ListPageWrapper';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';
import { RentStatus } from '../../constants/enums';

const RentsList: React.FC = () => {
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
    const tenantId = urlParams.get('tenantId');
    const roomId = urlParams.get('roomId');

    console.log('URL params - ownerId:', ownerId, 'propertyId:', propertyId, 'tenantId:', tenantId, 'roomId:', roomId);

    if (ownerId) {
      console.log('Setting ownerId filter:', ownerId);
      handleFilterChange('ownerId', ownerId);
    }
    if (propertyId) {
      console.log('Setting propertyId filter:', propertyId);
      handleFilterChange('propertyId', propertyId);
    }
    if (tenantId) {
      console.log('Setting tenantId filter:', tenantId);
      handleFilterChange('tenantId', tenantId);
    }
    if (roomId) {
      console.log('Setting roomId filter:', roomId);
      handleFilterChange('roomId', roomId);
    }

    setInitialUrlParamsProcessed(true);
  }, [urlParams, handleFilterChange]);

  // Fetch lookup data with error handling
  const { data: owners, isLoading: ownersLoading, error: ownersError } = useQuery({
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

  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useQuery({
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

  const { data: rooms, isLoading: roomsLoading, error: roomsError } = useQuery({
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

  const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useQuery({
    queryKey: ['tenants-lookup', urlParams.get('ownerId'), filters.filterValues.ownerId],
    queryFn: async () => {
      try {
        // Use URL param first, then fall back to filter value
        const ownerIdParam = urlParams.get('ownerId');
        const ownerIdFilter = filters.filterValues.ownerId;
        const ownerId = ownerIdParam || (ownerIdFilter && ownerIdFilter !== 'all' ? ownerIdFilter : undefined);

        const ownerIdNumber = ownerId ? Number(ownerId) : undefined;
        console.log('Fetching tenants for ownerId:', ownerIdNumber, '(from URL:', ownerIdParam, ', from filter:', ownerIdFilter, ')');

        const result = await lookupApi.getTenants(ownerIdNumber);
        console.log('Tenants lookup response:', result);
        return result;
      } catch (error) {
        console.warn('Failed to load tenants lookup:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: true, // Always enable this query
  });

  // Fetch rents with enhanced pagination
  const { data: rentsData, isLoading: rentsLoading, error: rentsError } = useQuery({
    queryKey: ['rents', searchTrigger, getSearchParams()],
    queryFn: async () => {
      try {
        const searchParams = getSearchParams() as RentTrackSearchRequest;
        console.log('Search params being sent:', searchParams);
        console.log('Current filter values:', filters.filterValues);
        const result = await rentTrackApi.search(searchParams);
        console.log('Rents API response:', result);
        return result;
      } catch (error) {
        console.error('Rents API error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (rentsData) {
      updatePaginationData({
        pageNumber: rentsData.pageNumber,
        pageSize: rentsData.pageSize,
        totalPages: rentsData.totalPages,
        totalRecords: rentsData.totalRecords,
        hasNextPage: rentsData.hasNextPage,
        hasPreviousPage: rentsData.hasPreviousPage
      });
    }
  }, [rentsData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (rentsError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [rentsError, pagination.pageSize, updatePaginationData]);

  // Prepare filter options with safe fallbacks
  const filterOptions = [
    {
      key: 'ownerId',
      label: 'Owner',
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: 'Select Owner'
    },
    {
      key: 'propertyId',
      label: 'Property',
      options: properties?.data?.map(property => ({
        value: property.id.toString(),
        label: property.value
      })) || [],
      placeholder: 'Select Property'
    },
    {
      key: 'roomId',
      label: 'Room',
      options: rooms?.data?.map(room => ({
        value: room.id.toString(),
        label: room.value
      })) || [],
      placeholder: 'Select Room'
    },
    {
      key: 'tenantId',
      label: 'Tenant',
      options: tenants?.data?.map(tenant => ({
        value: tenant.id.toString(),
        label: tenant.value
      })) || [],
      placeholder: 'Select Tenant'
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: RentStatus.FullyPaid.toString(), label: 'Paid' },
        { value: RentStatus.Pending.toString(), label: 'Pending' },
        { value: RentStatus.PartiallyPaid.toString(), label: 'Partial' }
      ],
      placeholder: 'Select Status'
    }
  ];

  // Initialize filter values with 'all' to prevent empty string issues
  React.useEffect(() => {
    // Only initialize if no URL parameters are present and initial URL params have been processed
    const hasUrlParams = urlParams.get('ownerId') || urlParams.get('propertyId') || urlParams.get('tenantId') || urlParams.get('roomId');

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

  // Show error only for rents loading, not for lookups
  if (rentsError) {
    return <ErrorMessage message="Failed to load rents" />;
  }

  const rents = rentsData?.data || [];

  return (
    <ListPageWrapper
      title="Rent Track"
      subtitle="Monitor rent payments and financial records"
      addButtonText="Add Rent Track"
      addButtonUrl="/rents/new"
      isLoading={rentsLoading}
      error={rentsError}
      data={rents}
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
      placeholder="Search rent records by amount or notes..."
      emptyStateIcon={Receipt}
      emptyStateTitle="No rent track records found"
      emptyStateMessage="Get started by adding your first rent track record."
      hasActiveFilters={hasActiveFilters}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rents.map((rent) => {
          // Get rent status label from enum
          const getRentStatusLabel = (status: number) => {
            switch (status) {
              case RentStatus.Pending:
                return 'Pending';
              case RentStatus.PartiallyPaid:
                return 'Partial';
              case RentStatus.FullyPaid:
                return 'Paid';
              default:
                return 'Unknown';
            }
          };

          const getRentStatusVariant = (status: number) => {
            switch (status) {
              case RentStatus.FullyPaid:
                return 'default' as const;
              case RentStatus.PartiallyPaid:
                return 'secondary' as const;
              case RentStatus.Pending:
                return 'destructive' as const;
              default:
                return 'destructive' as const;
            }
          };

          const cardItem: EntityCardItem = {
            id: rent.rentTrackId,
            title: `Rent #${rent.rentTrackId}`,
            subtitle: `Property: ${rent.propertyId}${rent.roomId ? ` • Room: ${rent.roomId}` : ''}`,
            viewUrl: `/rents/${rent.rentTrackId}`,
            editUrl: `/rents/${rent.rentTrackId}/edit`,
            badges: [
              {
                label: 'Rent Track',
                variant: 'secondary' as const
              }
            ],
            details: [
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: 'Expected',
                value: formatCurrency(rent.expectedRentValue || 0)
              },
              {
                icon: <Receipt className="w-4 h-4" />,
                label: 'Received',
                value: formatCurrency(rent.receivedRentValue || 0)
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: 'Period',
                value: `${formatDate(rent.rentPeriodStartDate)} - ${formatDate(rent.rentPeriodEndDate)}`
              }
            ],
            footerStatus: {
              label: getRentStatusLabel(rent.status),
              variant: getRentStatusVariant(rent.status)
            },
            footerAction: {
              label: `Tenant #${rent.tenantId}`,
              icon: <Eye className="w-3 h-3" />,
              url: `/tenants/${rent.tenantId}`
            }
          };

          return (
            <EntityCard
              key={rent.rentTrackId}
              item={cardItem}
            />
          );
        })}
      </div>
    </ListPageWrapper>
  );
};

export default RentsList;