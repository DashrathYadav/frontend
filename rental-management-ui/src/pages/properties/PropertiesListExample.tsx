import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, MapPin, DollarSign, Home, Eye } from 'lucide-react';
import { propertyApi, lookupApi } from '../../services/api';
import { PropertySearchRequest, Property } from '../../types';
import { PropertyType, getPropertyTypeValue } from '../../constants';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import FilterBar from '../../components/FilterBar';
import { StatusBadge } from '../../components/ui/badge-system';
import PaginationEnhanced from '../../components/PaginationEnhanced';
import { useGridPagination } from '../../hooks/usePagination';
import { PAGINATION_TYPES } from '../../constants/pagination';

/**
 * Example component showing how to use the new standardized pagination system
 * This demonstrates the improved approach compared to the current implementation
 */
const PropertiesListExample: React.FC = () => {
    // Use the new pagination hook for grid layout
    const pagination = useGridPagination<Property>({
        type: PAGINATION_TYPES.GRID
    });

    // Search parameters state
    const [searchParams, setSearchParams] = useState<Omit<PropertySearchRequest, 'pageNumber' | 'pageSize'>>({
        sortBy: 'propertyName',
        sortDirection: 'asc'
    });

    // Fetch lookup data
    const { data: owners } = useQuery({
        queryKey: ['owners-lookup'],
        queryFn: lookupApi.getOwners,
    });

    const { data: propertyTypes } = useQuery({
        queryKey: ['property-types'],
        queryFn: lookupApi.getPropertyTypes,
    });

    // Fetch properties with pagination
    const { data: propertiesData, isLoading, error } = useQuery({
        queryKey: ['properties', { ...searchParams, ...pagination.pagination }],
        queryFn: () => propertyApi.search({
            ...searchParams,
            pageNumber: pagination.pagination.pageNumber,
            pageSize: pagination.pagination.pageSize
        }),
        onSuccess: (data) => {
            // Update pagination state with API response
            pagination.setData(data);
        },
        onError: () => {
            // Reset pagination on error
            pagination.setData({
                data: [],
                totalRecords: 0,
                pageNumber: 1,
                pageSize: pagination.pagination.pageSize,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            });
        }
    });

    // Handle search changes
    const handleSearchChange = (searchTerm: string) => {
        setSearchParams(prev => ({
            ...prev,
            searchTerm
        }));
        // Reset to first page when search changes
        pagination.actions.setPage(1);
    };

    // Handle filter changes
    const handleOwnerFilter = (ownerId: string) => {
        setSearchParams(prev => ({
            ...prev,
            ownerId: ownerId ? Number(ownerId) : undefined
        }));
        pagination.actions.setPage(1);
    };

    const handleTypeFilter = (propertyType: string) => {
        setSearchParams(prev => ({
            ...prev,
            propertyType: propertyType ? Number(propertyType) as PropertyType : undefined
        }));
        pagination.actions.setPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message="Failed to load properties" />;
    }

    const properties = pagination.data;

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

            {/* Filters */}
            <FilterBar
                searchTerm={searchParams.searchTerm || ''}
                onSearchChange={handleSearchChange}
                placeholder="Search properties by name, description, or facility..."
            >
                <select
                    value={searchParams.ownerId?.toString() || ''}
                    onChange={(e) => handleOwnerFilter(e.target.value)}
                    className="form-select"
                >
                    <option value="">All Owners</option>
                    {owners?.data?.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                            {owner.value}
                        </option>
                    ))}
                </select>

                <select
                    value={searchParams.propertyType?.toString() || ''}
                    onChange={(e) => handleTypeFilter(e.target.value)}
                    className="form-select"
                >
                    <option value="">All Types</option>
                    {propertyTypes?.data?.map((type) => (
                        <option key={type.id} value={type.id}>
                            {type.value}
                        </option>
                    ))}
                </select>
            </FilterBar>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                    <div key={property.propertyId} className="card overflow-hidden hover:shadow-lg transition-all duration-200">
                        {property.propertyPic && (
                            <div className="h-48 bg-gray-200 relative">
                                <img
                                    src={property.propertyPic}
                                    alt={property.propertyName}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 right-4">
                                    <StatusBadge status={property.status} category="availability" />
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {property.propertyName}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {getPropertyTypeValue(property.propertyType)} • {property.propertySize}
                                    </p>
                                </div>
                                <Link
                                    to={`/properties/${property.propertyId}/edit`}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                    {formatCurrency(property.propertyRent)} / month
                                </div>

                                {property.address && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        {property.address.city}, {property.address.state}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {property.propertyDescription}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    ID: #{property.propertyId}
                                </span>
                                <Link
                                    to={`/rooms?propertyId=${property.propertyId}`}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    View Rooms →
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced Pagination */}
            <PaginationEnhanced
                pagination={pagination.pagination}
                actions={pagination.actions}
                paginationType={PAGINATION_TYPES.GRID}
                showPageSizeSelector={true}
                showInfo={true}
                showFirstLast={true}
            />

            {/* Empty State */}
            {properties.length === 0 && (
                <div className="text-center py-12">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-600 mb-6">
                        {searchParams.searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first property'}
                    </p>
                    <Link to="/properties/new" className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                    </Link>
                </div>
            )}
        </div>
    );
};

export default PropertiesListExample; 