import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, MapPin, DollarSign, Building2, Home, Eye, Edit, ExternalLink } from 'lucide-react';
import { propertyApi, lookupApi } from '../../services/api';
import { PropertySearchRequest } from '../../types';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EnhancedFilterBar from '../../components/EnhancedFilterBar';
import EnhancedPagination from '../../components/EnhancedPagination';
import DataTable, { DataTableColumn, DataTableAction } from '../../components/DataTable';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import { useLookup } from '../../contexts/LookupContext';

const PropertiesList: React.FC = () => {
  const { t } = useTranslation();
  const {
    getPropertyTypeName,
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

  // Fetch properties with enhanced pagination
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['properties', searchTrigger, getSearchParams()],
    queryFn: async () => {
      try {
        const searchParams = getSearchParams() as PropertySearchRequest;
        console.log('Search params being sent:', searchParams);
        const result = await propertyApi.search(searchParams);
        console.log('Properties API response:', result);
        return result;
      } catch (error) {
        console.error('Properties API error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update pagination data when query succeeds
  React.useEffect(() => {
    if (propertiesData) {
      updatePaginationData({
        pageNumber: propertiesData.pageNumber,
        pageSize: propertiesData.pageSize,
        totalPages: propertiesData.totalPages,
        totalRecords: propertiesData.totalRecords,
        hasNextPage: propertiesData.hasNextPage,
        hasPreviousPage: propertiesData.hasPreviousPage
      });
    }
  }, [propertiesData, updatePaginationData]);

  // Reset pagination on error
  React.useEffect(() => {
    if (propertiesError) {
      updatePaginationData({
        pageNumber: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }
  }, [propertiesError, pagination.pageSize, updatePaginationData]);

  // Prepare filter options with safe fallbacks
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
      key: 'propertyTypeId',
      label: t('properties.propertyType'),
      options: lookups.propertyTypes.map(type => ({
        value: type.id.toString(),
        label: type.value
      })),
      placeholder: t('properties.selectType')
    },
    {
      key: 'statusId',
      label: t('common.status'),
      options: lookups.availabilityStatuses.map(status => ({
        value: status.id.toString(),
        label: status.value
      })),
      placeholder: t('properties.selectStatus')
    }
  ];

  // Initialize filter values with 'all' to prevent empty string issues
  React.useEffect(() => {
    if (filterOptions.length > 0 && Object.keys(filters.filterValues).length === 0) {
      filterOptions.forEach(filter => {
        handleFilterChange(filter.key, 'all');
      });
    }
  }, [filterOptions, filters.filterValues, handleFilterChange]);

  // Trigger initial search when component mounts
  React.useEffect(() => {
    handleSearch();
  }, []); // Only run once on mount

  // Show error only for properties loading, not for lookups
  if (propertiesError) {
    return <ErrorMessage message={t('properties.errorLoading')} />;
  }

  const properties = propertiesData?.data || [];

  // Debug logging
  console.log('Properties data:', propertiesData);
  console.log('Properties array:', properties);
  console.log('Properties loading:', propertiesLoading);
  console.log('Properties error:', propertiesError);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('properties.title')}</h1>
          <p className="text-gray-600 mt-2">{t('properties.manageDescription')}</p>
        </div>
        <Link to="/properties/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          {t('properties.add')}
        </Link>
      </div>

      {/* Enhanced Filter Bar */}
      <EnhancedFilterBar
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchTermChange}
        onSearch={handleSearch}
        filters={filterOptions}
        filterValues={filters.filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder={t('properties.searchPlaceholder')}
      />

      {/* Loading State */}
      {propertiesLoading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Properties Table */}
      {!propertiesLoading && (
        <>
          {properties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('properties.noPropertiesFound')}</h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? t('properties.adjustFilters')
                  : t('properties.getStarted')
                }
              </p>
            </div>
          ) : (
            <DataTable
              data={properties}
              columns={[
                {
                  key: 'propertyName',
                  label: t('properties.name'),
                  sortable: true,
                  render: (property) => (
                    <div>
                      <div className="font-medium text-gray-900">{property.propertyName}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{property.propertyDescription || t('properties.noDescription')}</div>
                    </div>
                  ),
                },
                {
                  key: 'propertyType',
                  label: t('properties.type'),
                  render: (property) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getPropertyTypeName(property.propertyTypeId)}
                    </span>
                  ),
                },
                {
                  key: 'location',
                  label: t('properties.location'),
                  render: (property) => (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{property.address.city}, {property.address.area}</span>
                    </div>
                  ),
                },
                {
                  key: 'propertyRent',
                  label: t('properties.rent'),
                  align: 'right',
                  render: (property) => (
                    <div className="flex items-center justify-end gap-2 text-gray-900 font-medium">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{formatCurrency(property.propertyRent)}</span>
                    </div>
                  ),
                },
                {
                  key: 'propertySize',
                  label: t('properties.size'),
                  align: 'center',
                  render: (property) => (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>{property.propertySize}</span>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: t('common.status'),
                  align: 'center',
                  render: (property) => {
                    const badgeClass = getAvailabilityStatusBadgeClass(property.statusId);
                    const colorMap: Record<string, string> = {
                      'success': 'bg-green-100 text-green-800',
                      'warning': 'bg-yellow-100 text-yellow-800',
                      'danger': 'bg-red-100 text-red-800',
                      'default': 'bg-gray-100 text-gray-800',
                    };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[badgeClass] || colorMap.default}`}>
                        {getAvailabilityStatusName(property.statusId)}
                      </span>
                    );
                  },
                },
              ]}
              actions={[
                {
                  label: t('common.view'),
                  icon: <Eye className="h-4 w-4" />,
                  href: (property) => `/properties/${property.propertyId}`,
                  variant: 'ghost',
                },
                {
                  label: t('common.edit'),
                  icon: <Edit className="h-4 w-4" />,
                  href: (property) => `/properties/${property.propertyId}/edit`,
                  variant: 'ghost',
                },
                {
                  label: t('properties.showRooms'),
                  icon: <ExternalLink className="h-4 w-4" />,
                  href: (property) => `/rooms?ownerId=${property.ownerId}&propertyId=${property.propertyId}`,
                  variant: 'ghost',
                  className: 'text-blue-600 hover:text-blue-700',
                },
              ]}
              getRowId={(property) => property.propertyId.toString()}
              emptyMessage={t('properties.noPropertiesFound')}
              hoverable
            />
          )}

          {/* Enhanced Pagination */}
          <EnhancedPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalRecords={pagination.totalRecords}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[6, 12, 24, 48]}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            isLoading={propertiesLoading}
          />
        </>
      )}
    </div>
  );
};

export default PropertiesList;