import React, { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import EnhancedFilterBar from './EnhancedFilterBar';
import EnhancedPagination from './EnhancedPagination';


interface FilterOption {
    value: string;
    label: string;
}

interface FilterField {
    key: string;
    label: string;
    options: FilterOption[];
    placeholder?: string;
}

interface ListPageWrapperProps {
    title: string;
    subtitle: string;
    addButtonText: string;
    addButtonUrl: string;
    isLoading: boolean;
    error: any;
    data: any;
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onSearch: () => void;
    onSearchChange: (value: string) => void;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    searchTerm: string;
    filterValues: Record<string, string>;
    filters?: FilterField[];
    placeholder?: string;
    pageSizeOptions?: number[];
    children: ReactNode;
    emptyStateIcon?: React.ComponentType<{ className?: string }>;
    emptyStateTitle?: string;
    emptyStateMessage?: string;
    hasActiveFilters?: boolean;
}

const ListPageWrapper: React.FC<ListPageWrapperProps> = ({
    title,
    subtitle,
    addButtonText,
    addButtonUrl,
    isLoading,
    error,
    data,
    totalRecords,
    currentPage,
    totalPages,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onSearchChange,
    onFilterChange,
    onClearFilters,
    searchTerm,
    filterValues,
    filters = [],
    placeholder = "Search...",
    pageSizeOptions = [6, 12, 24, 48],
    children,
    emptyStateIcon: EmptyStateIcon,
    emptyStateTitle = "No items found",
    emptyStateMessage = "Get started by adding your first item.",
    hasActiveFilters = false
}) => {
    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                        <p className="text-gray-600 mt-2">{subtitle}</p>
                    </div>
                    <Link to={addButtonUrl} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        {addButtonText}
                    </Link>
                </div>
                <div className="text-center py-12">
                    <div className="text-red-500 mb-4">Error loading data</div>
                    <p className="text-gray-600">{error.message || 'An error occurred while loading the data.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600 mt-2">{subtitle}</p>
                </div>
                <Link to={addButtonUrl} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    {addButtonText}
                </Link>
            </div>

            {/* Enhanced Filter Bar */}
            <EnhancedFilterBar
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                onSearch={onSearch}
                filters={filters}
                filterValues={filterValues}
                onFilterChange={onFilterChange}
                onClearFilters={onClearFilters}
                placeholder={placeholder}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {/* Content */}
            {!isLoading && (
                <>
                    {(!data || data.length === 0) ? (
                        <div className="text-center py-12">
                            {EmptyStateIcon && <EmptyStateIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateTitle}</h3>
                            <p className="text-gray-600">
                                {hasActiveFilters
                                    ? "Try adjusting your search criteria or filters."
                                    : emptyStateMessage
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            {children}

                            {/* Enhanced Pagination */}
                            <EnhancedPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalRecords={totalRecords}
                                onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange}
                                pageSizeOptions={pageSizeOptions}
                                hasNextPage={hasNextPage}
                                hasPreviousPage={hasPreviousPage}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default ListPageWrapper; 