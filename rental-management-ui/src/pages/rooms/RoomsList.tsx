import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Users, DollarSign, Home } from 'lucide-react';
import { roomApi, lookupApi } from '../../services/api';
import { RoomSearchRequest } from '../../types';
import { formatCurrency } from '../../utils';
import ListPageWrapper from '../../components/ListPageWrapper';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';
import { useLookup } from '../../contexts/LookupContext';

const RoomsList: React.FC = () => {
  const [urlParams] = useSearchParams();
  
  // Use LookupContext for consistent lookup data
  const { 
    getRoomTypeName,
    getAvailabilityStatusName,
    getAvailabilityStatusBadgeClass,
    lookups
  } = useLookup();

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

    console.log('URL params - ownerId:', ownerId, 'propertyId:', propertyId);

    if (ownerId) {
      console.log('Setting ownerId filter:', ownerId);
      handleFilterChange('ownerId', ownerId);
    }
    if (propertyId) {
      console.log('Setting propertyId filter:', propertyId);
      handleFilterChange('propertyId', propertyId);
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

  // Room types are now provided by LookupContext

  // Fetch rooms with enhanced pagination
  const { data: roomsData, isLoading: roomsLoading, error: roomsError } = useQuery({
    queryKey: ['rooms', searchTrigger, getSearchParams()],
    queryFn: async () => {
      try {
        const searchParams = getSearchParams() as RoomSearchRequest;
        console.log('Search params being sent:', searchParams);
        console.log('Current filter values:', filters.filterValues);
        const result = await roomApi.search(searchParams);
        console.log('Rooms API response:', result);
        return result;
      } catch (error) {
        console.error('Rooms API error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (roomsData) {
      updatePaginationData({
        pageNumber: roomsData.pageNumber,
        pageSize: roomsData.pageSize,
        totalPages: roomsData.totalPages,
        totalRecords: roomsData.totalRecords,
        hasNextPage: roomsData.hasNextPage,
        hasPreviousPage: roomsData.hasPreviousPage
      });
    }
  }, [roomsData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (roomsError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [roomsError, pagination.pageSize, updatePaginationData]);

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
      key: 'roomTypeId',
      label: 'Room Type',
      options: lookups.roomTypes.map(type => ({
        value: type.id.toString(),
        label: type.value
      })),
      placeholder: 'Select Type'
    },
    {
      key: 'statusId',
      label: 'Status',
      options: lookups.availabilityStatuses.map(status => ({
        value: status.id.toString(),
        label: status.value
      })),
      placeholder: 'Select Status'
    }
  ];

  // Initialize filter values with 'all' to prevent empty string issues
  React.useEffect(() => {
    // Only initialize if no URL parameters are present and initial URL params have been processed
    const hasUrlParams = urlParams.get('ownerId') || urlParams.get('propertyId');

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

  // Show error only for rooms loading, not for lookups
  if (roomsError) {
    return <ErrorMessage message="Failed to load rooms" />;
  }

  const rooms = roomsData?.data || [];

  return (
    <ListPageWrapper
      title="Rooms"
      subtitle="Manage individual rooms and their availability"
      addButtonText="Add Room"
      addButtonUrl="/rooms/new"
      isLoading={roomsLoading}
      error={roomsError}
      data={rooms}
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
      placeholder="Search rooms by number, type, or description..."
      emptyStateIcon={Home}
      emptyStateTitle="No rooms found"
      emptyStateMessage="Get started by adding your first room."
      hasActiveFilters={hasActiveFilters}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => {

          const cardItem: EntityCardItem = {
            id: room.roomId,
            title: `Room ${room.roomNo}`,
            subtitle: room.roomSize || 'No size specified',
            viewUrl: `/rooms/${room.roomId}`,
            editUrl: `/rooms/${room.roomId}/edit`,
            badges: [
              {
                label: getRoomTypeName(room.roomTypeId || 0),
                variant: 'secondary' as const
              }
            ],
            details: [
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: 'Rent',
                value: formatCurrency(room.roomRent)
              },
              {
                icon: <Users className="w-4 h-4" />,
                label: 'Tenants',
                value: `${room.currentTenantCount}/${room.tenantLimit}`
              },
              {
                icon: <Home className="w-4 h-4" />,
                label: 'Property',
                value: room.propertyName || 'Unknown Property'
              }
            ],
            footerStatus: {
              label: getAvailabilityStatusName(room.statusId),
              variant: getAvailabilityStatusBadgeClass(room.statusId) as 'default' | 'secondary' | 'destructive' | 'outline'
            },
            footerAction: {
              label: 'Show Tenants',
              icon: <Users className="w-3 h-3" />,
              url: `/tenants?ownerId=${room.ownerId}&propertyId=${room.propertyId}&roomNumber=${room.roomId}`
            }
          };

          return (
            <EntityCard
              key={room.roomId}
              item={cardItem}
            />
          );
        })}
      </div>
    </ListPageWrapper>
  );
};

export default RoomsList;