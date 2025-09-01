import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, MapPin, DollarSign, Building2, Home } from 'lucide-react';
import { propertyApi, lookupApi } from '../../services/api';
import { PropertySearchRequest } from '../../types';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EnhancedFilterBar from '../../components/EnhancedFilterBar';
import EnhancedPagination from '../../components/EnhancedPagination';
import EntityCard, { EntityCardItem } from '../../components/EntityCard';
import { useEnhancedPagination } from '../../hooks/useEnhancedPagination';
import { useLookup } from '../../contexts/LookupContext';

const PropertiesList: React.FC = () => {
  const { 
    getPropertyTypeName, 
    getAvailabilityStatusName,
    getAvailabilityStatusBadgeClass,
    lookups,
    isLoading: lookupsLoading
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
      label: 'Owner',
      options: owners?.data?.map(owner => ({
        value: owner.id.toString(),
        label: owner.value
      })) || [],
      placeholder: 'Select Owner'
    },
    {
      key: 'propertyTypeId',
      label: 'Property Type',
      options: lookups.propertyTypes.map(type => ({
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
    return <ErrorMessage message="Failed to load properties" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-2">Manage your rental properties</p>
        </div>
        <Link to="/properties/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Property
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
        placeholder="Search properties by name, description, or facility..."
      />

      {/* Loading State */}
      {propertiesLoading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Properties Grid */}
      {!propertiesLoading && (
        <>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first property."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => {

                const cardItem: EntityCardItem = {
                  id: property.propertyId,
                  title: property.propertyName,
                  subtitle: property.propertyDescription || 'No description available',
                  viewUrl: `/properties/${property.propertyId}`,
                  editUrl: `/properties/${property.propertyId}/edit`,
                  badges: [
                    {
                      label: getPropertyTypeName(property.propertyTypeId),
                      variant: 'secondary' as const
                    }
                  ],
                  details: [
                    {
                      icon: <MapPin className="w-4 h-4" />,
                      label: 'Location',
                      value: `${property.address.city}, ${property.address.area}`
                    },
                    {
                      icon: <DollarSign className="w-4 h-4" />,
                      label: 'Rent',
                      value: formatCurrency(property.propertyRent)
                    },
                    {
                      icon: <Home className="w-4 h-4" />,
                      label: 'Size',
                      value: property.propertySize
                    }
                  ],
                  footerStatus: {
                    label: getAvailabilityStatusName(property.statusId),
                    variant: getAvailabilityStatusBadgeClass(property.statusId) as 'default' | 'secondary' | 'destructive' | 'outline'
                  },
                  footerAction: {
                    label: 'Show Rooms',
                    icon: <Building2 className="w-3 h-3" />,
                    url: `/rooms?ownerId=${property.ownerId}&propertyId=${property.propertyId}`
                  }
                };

                return (
                  <EntityCard
                    key={property.propertyId}
                    item={cardItem}
                  />
                );
              })}
            </div>
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