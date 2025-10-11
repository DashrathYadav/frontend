import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, Home, Eye, Edit, ExternalLink } from 'lucide-react';
import { roomApi, lookupApi } from '../../services/api';
import { RoomSearchRequest } from '../../types';
import { formatCurrency } from '../../utils';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';
import { useLookup } from '../../contexts/LookupContext';

const RoomsList: React.FC = () => {
  const { t } = useTranslation();
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
      label: t('properties.owner'),
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: t('rooms.selectOwner')
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
      key: 'roomTypeId',
      label: t('rooms.roomType'),
      options: lookups.roomTypes.map(type => ({
        value: type.id.toString(),
        label: type.value
      })),
      placeholder: t('rooms.selectType')
    },
    {
      key: 'statusId',
      label: t('common.status'),
      options: lookups.availabilityStatuses.map(status => ({
        value: status.id.toString(),
        label: status.value
      })),
      placeholder: t('rooms.selectStatus')
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
    return <ErrorMessage message={t('rooms.errorLoading')} />;
  }

  const rooms = roomsData?.data || [];

  // Define table columns
  const columns: DataTableColumn<typeof rooms[0]>[] = [
    {
      key: 'roomNo',
      label: t('rooms.roomNumber'),
      sortable: true,
      render: (room) => (
        <div>
          <div className="font-medium text-gray-900">{t('rooms.roomPrefix')}{room.roomNo}</div>
          <div className="text-sm text-gray-500">{room.roomSize || t('rooms.noSizeSpecified')}</div>
        </div>
      ),
    },
    {
      key: 'roomType',
      label: t('rooms.type'),
      render: (room) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {getRoomTypeName(room.roomTypeId || 0)}
        </span>
      ),
    },
    {
      key: 'propertyName',
      label: t('rooms.property'),
      render: (room) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Home className="w-4 h-4 text-gray-400" />
          <span>{room.propertyName || t('properties.noDescription')}</span>
        </div>
      ),
    },
    {
      key: 'roomRent',
      label: t('rooms.rent'),
      align: 'right',
      render: (room) => (
        <div className="flex items-center justify-end gap-2 text-gray-900 font-medium">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>{formatCurrency(room.roomRent)}</span>
        </div>
      ),
    },
    {
      key: 'tenants',
      label: t('rooms.occupancy'),
      align: 'center',
      render: (room) => (
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className={`font-medium ${
            room.currentTenantCount >= room.tenantLimit
              ? 'text-red-600'
              : room.currentTenantCount > 0
                ? 'text-orange-600'
                : 'text-green-600'
          }`}>
            {room.currentTenantCount}/{room.tenantLimit}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('common.status'),
      align: 'center',
      render: (room) => {
        const badgeClass = getAvailabilityStatusBadgeClass(room.statusId);
        const colorMap: Record<string, string> = {
          'success': 'bg-green-100 text-green-800',
          'warning': 'bg-yellow-100 text-yellow-800',
          'danger': 'bg-red-100 text-red-800',
          'default': 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[badgeClass] || colorMap.default}`}>
            {getAvailabilityStatusName(room.statusId)}
          </span>
        );
      },
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof rooms[0]>[] = [
    {
      label: t('common.view'),
      icon: <Eye className="h-4 w-4" />,
      href: (room) => `/rooms/${room.roomId}`,
      variant: 'ghost',
    },
    {
      label: t('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      href: (room) => `/rooms/${room.roomId}/edit`,
      variant: 'ghost',
    },
    {
      label: t('rooms.showTenants'),
      icon: <ExternalLink className="h-4 w-4" />,
      href: (room) => `/tenants?ownerId=${room.ownerId}&propertyId=${room.propertyId}&roomId=${room.roomId}`,
      variant: 'ghost',
      className: 'text-blue-600 hover:text-blue-700',
    },
  ];

  return (
    <ListPageWrapper
      title={t('rooms.title')}
      subtitle={t('rooms.manageDescription')}
      addButtonText={t('rooms.add')}
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
      placeholder={t('rooms.searchPlaceholder')}
      emptyStateIcon={Home}
      emptyStateTitle={t('rooms.noRoomsFound')}
      emptyStateMessage={t('rooms.getStarted')}
      hasActiveFilters={hasActiveFilters}
    >
      <DataTable
        data={rooms}
        columns={columns}
        actions={actions}
        getRowId={(room) => room.roomId.toString()}
        emptyMessage={t('rooms.noRoomsFound')}
        hoverable
      />
    </ListPageWrapper>
  );
};

export default RoomsList;