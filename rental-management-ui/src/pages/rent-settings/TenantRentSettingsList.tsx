import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, Eye, Edit, Home, UserCheck, Clock } from 'lucide-react';
import { tenantRentSettingApi, lookupApi } from '../../services/api';
import { TenantRentSettingSearchRequest } from '../../types';
import ListPageWrapper from '../../components/ListPageWrapper';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import ErrorMessage from '../../components/ErrorMessage';
import { formatCurrency } from '../../utils';

const TenantRentSettingsList: React.FC = () => {
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
    const mappingId = urlParams.get('mappingId');

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
    if (mappingId) {
      handleFilterChange('mappingId', mappingId);
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

  // Fetch rent settings
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['tenant-rent-settings', searchTrigger, getSearchParams()],
    queryFn: async () => {
      const searchParams = getSearchParams() as TenantRentSettingSearchRequest;
      return await tenantRentSettingApi.search(searchParams);
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (settingsData) {
      updatePaginationData({
        pageNumber: settingsData.pageNumber,
        pageSize: settingsData.pageSize,
        totalPages: settingsData.totalPages,
        totalRecords: settingsData.totalRecords,
        hasNextPage: settingsData.hasNextPage,
        hasPreviousPage: settingsData.hasPreviousPage
      });
    }
  }, [settingsData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (settingsError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [settingsError, pagination.pageSize, updatePaginationData]);

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
    }
  ];

  // Initialize filter values
  React.useEffect(() => {
    const hasUrlParams = urlParams.get('ownerId') || urlParams.get('propertyId') || urlParams.get('roomId') || urlParams.get('tenantId') || urlParams.get('mappingId');

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

  if (settingsError) {
    return <ErrorMessage message={t('rentSettings.errorLoading')} />;
  }

  const settings = settingsData?.data || [];

  // Define table columns
  const columns: DataTableColumn<typeof settings[0]>[] = [
    {
      key: 'tenant',
      label: t('tenants.tenant'),
      sortable: true,
      render: (setting) => (
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{setting.tenantName}</div>
            <div className="text-sm text-gray-500">{t('boardTenants.roomPrefix')}{setting.roomNo}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'property',
      label: t('rooms.property'),
      render: (setting) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Home className="w-4 h-4 text-gray-400" />
          <span>{setting.propertyName}</span>
        </div>
      ),
    },
    {
      key: 'presentRentValue',
      label: t('rentSettings.presentRent'),
      align: 'right',
      sortable: true,
      render: (setting) => (
        <div className="flex items-center justify-end gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{formatCurrency(setting.presentRentValue || 0)}</span>
        </div>
      ),
    },
    {
      key: 'deposited',
      label: t('rentSettings.deposit'),
      align: 'right',
      render: (setting) => (
        <div className="flex items-center justify-end gap-2">
          <DollarSign className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-blue-600">{formatCurrency(setting.deposited)}</span>
        </div>
      ),
    },
    {
      key: 'depositToReturn',
      label: t('rentSettings.depositToReturn'),
      align: 'right',
      render: (setting) => (
        <span className="font-medium text-green-600">{formatCurrency(setting.depositToReturn)}</span>
      ),
    },
    {
      key: 'rentPeriod',
      label: t('rentSettings.rentPeriod'),
      align: 'center',
      render: (setting) => (
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>
            {setting.rentRecurringPeriodInDays
              ? `${setting.rentRecurringPeriodInDays} ${setting.rentRecurringPeriodInDays > 1 ? t('boardTenants.days') : t('boardTenants.day')}`
              : t('rentSettings.notSet')}
          </span>
        </div>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<typeof settings[0]>[] = [
    {
      label: t('common.view'),
      icon: <Eye className="h-4 w-4" />,
      href: (setting) => `/rent-settings/${setting.tenantRentSettingId}`,
      variant: 'ghost',
    },
    {
      label: t('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      href: (setting) => `/rent-settings/${setting.tenantRentSettingId}/edit`,
      variant: 'ghost',
    },
  ];

  return (
    <ListPageWrapper
      title={t('rentSettings.tenantRentSettings')}
      subtitle={t('rentSettings.manageDescription')}
      addButtonText={t('rentSettings.createRentSettings')}
      addButtonUrl="/rent-settings/new"
      isLoading={settingsLoading}
      error={settingsError}
      data={settings}
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
      placeholder={t('rentSettings.searchPlaceholder')}
      emptyStateIcon={DollarSign}
      emptyStateTitle={t('rentSettings.noSettingsFound')}
      emptyStateMessage={t('rentSettings.getStarted')}
      hasActiveFilters={hasActiveFilters}
    >
      <DataTable
        data={settings}
        columns={columns}
        actions={actions}
        getRowId={(setting) => setting.tenantRentSettingId.toString()}
        emptyMessage={t('rentSettings.noSettingsFound')}
        hoverable
      />
    </ListPageWrapper>
  );
};

export default TenantRentSettingsList;
