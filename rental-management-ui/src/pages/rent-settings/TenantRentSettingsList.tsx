import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar } from 'lucide-react';
import { tenantRentSettingApi, lookupApi } from '../../services/api';
import { TenantRentSettingSearchRequest } from '../../types';
import ListPageWrapper from '../../components/ListPageWrapper';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {settings.map((setting) => {
          const cardItem: EntityCardItem = {
            id: setting.tenantRentSettingId,
            title: `${setting.tenantName} - ${t('boardTenants.roomPrefix')}${setting.roomNo}`,
            subtitle: setting.propertyName,
            viewUrl: `/rent-settings/${setting.tenantRentSettingId}`,
            editUrl: `/rent-settings/${setting.tenantRentSettingId}/edit`,
            badges: [
              {
                label: t('rentSettings.rentSetting'),
                variant: 'default' as const
              }
            ],
            details: [
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: t('rentSettings.presentRent'),
                value: formatCurrency(setting.presentRentValue || 0)
              },
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: t('rentSettings.deposit'),
                value: formatCurrency(setting.deposited)
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: t('rentSettings.rentPeriod'),
                value: setting.rentRecurringPeriodInDays
                  ? `${t('rentSettings.everyDays')} ${setting.rentRecurringPeriodInDays} ${setting.rentRecurringPeriodInDays > 1 ? t('boardTenants.days') : t('boardTenants.day')}`
                  : t('rentSettings.notSet')
              }
            ],
            footerStatus: {
              label: `${t('rentSettings.depositToReturn')}: ${formatCurrency(setting.depositToReturn)}`,
              variant: 'default' as const
            },
            footerActions: []
          };

          return (
            <EntityCard
              key={setting.tenantRentSettingId}
              item={cardItem}
            />
          );
        })}
      </div>
    </ListPageWrapper>
  );
};

export default TenantRentSettingsList;
