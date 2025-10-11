import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, Receipt, Eye, Edit, UserCheck } from 'lucide-react';
import { rentTrackApi, lookupApi } from '../../services/api';
import { RentTrackSearchRequest } from '../../types';
import { formatDate, formatCurrency } from '../../utils';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';
import { useLookup } from '../../contexts/LookupContext';


const RentsList: React.FC = () => {
  const { t } = useTranslation();
  const { lookups, getRentStatusName, getRentStatusBadgeClass } = useLookup();
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

  const { data: tenants } = useQuery({
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
      label: t('properties.owner'),
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: t('rents.selectOwner')
    },
    {
      key: 'propertyId',
      label: t('rooms.property'),
      options: properties?.data?.map(property => ({
        value: property.id.toString(),
        label: property.value
      })) || [],
      placeholder: t('rents.selectProperty')
    },
    {
      key: 'roomId',
      label: t('rents.roomLabel'),
      options: rooms?.data?.map(room => ({
        value: room.id.toString(),
        label: room.value
      })) || [],
      placeholder: t('rents.selectRoom')
    },
    {
      key: 'tenantId',
      label: t('tenants.tenant'),
      options: tenants?.data?.map(tenant => ({
        value: tenant.id.toString(),
        label: tenant.value
      })) || [],
      placeholder: t('rents.selectTenant')
    },
    {
      key: 'status',
      label: t('common.status'),
      options: lookups.rentStatuses.map(status => ({
        value: status.id.toString(),
        label: status.value
      })),      placeholder: t('rents.selectStatus')
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
    return <ErrorMessage message={t('rents.errorLoading')} />;
  }

  const rents = rentsData?.data || [];

  // Define table columns
  const columns: DataTableColumn<typeof rents[0]>[] = [
    {
      key: 'tenantName',
      label: t('tenants.tenant'),
      sortable: true,
      render: (rent) => (
        <div>
          <div className="font-medium text-gray-900">{rent.tenantName}</div>
          <div className="text-sm text-gray-500">{rent.propertyName}{rent.roomNo ? ` | Room ${rent.roomNo}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'expectedRentValue',
      label: t('rents.expected'),
      align: 'right',
      sortable: true,
      render: (rent) => (
        <div className="flex items-center justify-end gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{formatCurrency(rent.expectedRentValue || 0)}</span>
        </div>
      ),
    },
    {
      key: 'receivedRentValue',
      label: t('rents.received'),
      align: 'right',
      render: (rent) => (
        <div className="flex items-center justify-end gap-2">
          <Receipt className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-green-600">{formatCurrency(rent.receivedRentValue || 0)}</span>
        </div>
      ),
    },
    {
      key: 'pending',
      label: t('rents.pending'),
      align: 'right',
      render: (rent) => {
        const pending = (rent.expectedRentValue || 0) - (rent.receivedRentValue || 0);
        return (
          <span className={`font-medium ${pending > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {formatCurrency(pending)}
          </span>
        );
      },
    },
    {
      key: 'rentPeriod',
      label: t('rents.period'),
      render: (rent) => (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <div>{formatDate(rent.rentPeriodStartDate)}</div>
            <div className="text-gray-400">to {formatDate(rent.rentPeriodEndDate)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('common.status'),
      align: 'center',
      render: (rent) => {
        const statusLabel = getRentStatusName(rent.statusId);
        const badgeClass = getRentStatusBadgeClass(rent.statusId);
        const colorMap: Record<string, string> = {
          'success': 'bg-green-100 text-green-800',
          'warning': 'bg-yellow-100 text-yellow-800',
          'danger': 'bg-red-100 text-red-800',
          'error': 'bg-red-100 text-red-800',
          'default': 'bg-gray-100 text-gray-800',
        };
        const baseClass = badgeClass.replace('badge-', '');
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[baseClass] || colorMap.default}`}>
            {statusLabel}
          </span>
        );
      },
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof rents[0]>[] = [
    {
      label: t('common.view'),
      icon: <Eye className="h-4 w-4" />,
      href: (rent) => `/rents/${rent.rentTrackId}`,
      variant: 'ghost',
    },
    {
      label: t('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      href: (rent) => `/rents/${rent.rentTrackId}/edit`,
      variant: 'ghost',
    },
    {
      label: t('rents.viewTenant'),
      icon: <UserCheck className="h-4 w-4" />,
      href: (rent) => `/tenants/${rent.tenantId}`,
      variant: 'ghost',
      className: 'text-blue-600 hover:text-blue-700',
    },
  ];

  return (
    <ListPageWrapper
      title={t('rents.title')}
      subtitle={t('rents.manageDescription')}
      addButtonText={t('rents.addRentTrack')}
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
      placeholder={t('rents.searchPlaceholder')}
      emptyStateIcon={Receipt}
      emptyStateTitle={t('rents.noRentRecordsFound')}
      emptyStateMessage={t('rents.getStarted')}
      hasActiveFilters={hasActiveFilters}
    >
      <DataTable
        data={rents}
        columns={columns}
        actions={actions}
        getRowId={(rent) => rent.rentTrackId.toString()}
        emptyMessage={t('rents.noRentRecordsFound')}
        hoverable
      />
    </ListPageWrapper>
  );
};

export default RentsList;