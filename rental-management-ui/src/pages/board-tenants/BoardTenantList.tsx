import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Eye, Edit, Home, UserCheck } from 'lucide-react';
import { roomTenantMappingApi, lookupApi } from '../../services/api';
import { RoomTenantMappingSearchRequest } from '../../types';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';

const BoardTenantList: React.FC = () => {
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
    const tenantId = urlParams.get('tenantId');

    if (ownerId) {
      handleFilterChange('ownerId', ownerId);
    }
    if (propertyId) {
      handleFilterChange('propertyId', propertyId);
    }
    if (roomId) {
      handleFilterChange('roomId', roomId);
    }
    if (tenantId) {
      handleFilterChange('tenantId', tenantId);
    }

    setInitialUrlParamsProcessed(true);
  }, [urlParams, handleFilterChange]);

  // Fetch lookup data
  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: properties } = useQuery({
    queryKey: ['properties-lookup', filters.filterValues.ownerId],
    queryFn: () => {
      const ownerId = filters.filterValues.ownerId;
      const ownerIdNumber = ownerId && ownerId !== 'all' ? Number(ownerId) : undefined;
      return lookupApi.getProperties(ownerIdNumber);
    },
    enabled: true,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-lookup', filters.filterValues.propertyId],
    queryFn: () => {
      const propertyId = filters.filterValues.propertyId;
      const propertyIdNumber = propertyId && propertyId !== 'all' ? Number(propertyId) : undefined;
      return propertyIdNumber ? lookupApi.getRoomsByProperty(propertyIdNumber) : Promise.resolve({ data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 });
    },
    enabled: true,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants-lookup', filters.filterValues.ownerId],
    queryFn: () => {
      const ownerId = filters.filterValues.ownerId;
      const ownerIdNumber = ownerId && ownerId !== 'all' ? Number(ownerId) : undefined;
      return lookupApi.getTenants(ownerIdNumber);
    },
    enabled: true,
  });

  // Fetch board tenant mappings
  const { data: mappingsData, isLoading: mappingsLoading, error: mappingsError } = useQuery({
    queryKey: ['room-tenant-mappings', searchTrigger, getSearchParams()],
    queryFn: async () => {
      const searchParams = getSearchParams() as RoomTenantMappingSearchRequest;
      return await roomTenantMappingApi.search(searchParams);
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (mappingsData) {
      updatePaginationData({
        pageNumber: mappingsData.pageNumber,
        pageSize: mappingsData.pageSize,
        totalPages: mappingsData.totalPages,
        totalRecords: mappingsData.totalRecords,
        hasNextPage: mappingsData.hasNextPage,
        hasPreviousPage: mappingsData.hasPreviousPage
      });
    }
  }, [mappingsData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (mappingsError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [mappingsError, pagination.pageSize, updatePaginationData]);

  // Prepare filter options
  const filterOptions = [
    {
      key: 'ownerId',
      label: t('properties.owner'),
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: t('properties.selectOwner')
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
      label: t('boardTenants.roomLabel'),
      options: rooms?.data?.map(room => ({
        value: room.id.toString(),
        label: room.value
      })) || [],
      placeholder: t('boardTenants.selectRoomPlaceholder')
    },
    {
      key: 'tenantId',
      label: t('tenants.tenant'),
      options: tenants?.data?.map(tenant => ({
        value: tenant.id.toString(),
        label: tenant.value
      })) || [],
      placeholder: t('boardTenants.selectTenantPlaceholder')
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

  // Initialize filter values
  React.useEffect(() => {
    const hasUrlParams = urlParams.get('ownerId') || urlParams.get('propertyId') || urlParams.get('roomId') || urlParams.get('tenantId');

    if (filterOptions.length > 0 && Object.keys(filters.filterValues).length === 0 && !hasUrlParams && initialUrlParamsProcessed) {
      filterOptions.forEach(filter => {
        handleFilterChange(filter.key, 'all');
      });
    }
  }, [filterOptions, filters.filterValues, handleFilterChange, urlParams, initialUrlParamsProcessed]);

  // Trigger initial search
  React.useEffect(() => {
    handleSearch();
  }, []);

  if (mappingsError) {
    return <ErrorMessage message={t('boardTenants.errorLoading')} />;
  }

  const mappings = mappingsData?.data || [];

  // Helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('boardTenants.notSet');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('boardTenants.invalidDate');
      return date.toLocaleDateString();
    } catch (error) {
      return t('boardTenants.invalidDate');
    }
  };

  // Define table columns
  const columns: DataTableColumn<typeof mappings[0]>[] = [
    {
      key: 'tenantName',
      label: t('tenants.tenant'),
      sortable: true,
      render: (mapping) => (
        <div>
          <div className="font-medium text-gray-900">{mapping.tenantName}</div>
          <div className="text-sm text-gray-500">#{mapping.roomTenantMappingId}</div>
        </div>
      ),
    },
    {
      key: 'property',
      label: t('rooms.property'),
      render: (mapping) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Home className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{mapping.propertyName}</div>
            <div className="text-sm text-gray-500">{t('boardTenants.roomPrefix')}{mapping.roomNo}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'boardingDate',
      label: t('boardTenants.boardingDate'),
      sortable: true,
      render: (mapping) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(mapping.boardingDate)}</span>
        </div>
      ),
    },
    {
      key: 'leavingDate',
      label: t('boardTenants.leavingDate'),
      render: (mapping) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(mapping.leavingDate)}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: t('common.status'),
      align: 'center',
      render: (mapping) => (
        <div className="flex flex-col items-center gap-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              mapping.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {mapping.isActive ? t('common.active') : t('common.inactive')}
          </span>
          <span className="text-xs text-gray-500">
            {mapping.isActive ? t('boardTenants.currentlyOccupied') : t('boardTenants.vacated')}
          </span>
        </div>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof mappings[0]>[] = [
    {
      label: t('common.view'),
      icon: <Eye className="h-4 w-4" />,
      href: (mapping) => `/board-tenants/${mapping.roomTenantMappingId}`,
      variant: 'ghost',
    },
    {
      label: t('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      href: (mapping) => `/board-tenants/${mapping.roomTenantMappingId}/edit`,
      variant: 'ghost',
    },
  ];

  return (
    <ListPageWrapper
      title={t('boardTenants.title')}
      subtitle={t('boardTenants.manageDescription')}
      addButtonText={t('boardTenants.boardNewTenant')}
      addButtonUrl="/board-tenants/new"
      isLoading={mappingsLoading}
      error={mappingsError}
      data={mappings}
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
      placeholder={t('boardTenants.searchPlaceholder')}
      emptyStateIcon={MapPin}
      emptyStateTitle={t('boardTenants.noMappingsFound')}
      emptyStateMessage={t('boardTenants.getStarted')}
      hasActiveFilters={hasActiveFilters}
    >
      <DataTable
        data={mappings}
        columns={columns}
        actions={actions}
        getRowId={(mapping) => mapping.roomTenantMappingId.toString()}
        emptyMessage={t('boardTenants.noMappingsFound')}
        hoverable
      />
    </ListPageWrapper>
  );
};

export default BoardTenantList;
