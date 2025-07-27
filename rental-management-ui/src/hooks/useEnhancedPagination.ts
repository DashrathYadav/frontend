import { useState, useCallback } from 'react';

interface UseEnhancedPaginationProps {
    initialPageSize?: number;
    initialPage?: number;
    pageSizeOptions?: number[];
}

interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface FilterState {
    searchTerm: string;
    filterValues: Record<string, string>;
}

export const useEnhancedPagination = ({
    initialPageSize = 12,
    initialPage = 1,
    pageSizeOptions = [6, 12, 24, 48]
}: UseEnhancedPaginationProps = {}) => {
    // Pagination state
    const [paginationState, setPaginationState] = useState<PaginationState>({
        currentPage: initialPage,
        pageSize: initialPageSize,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    // Filter state
    const [filterState, setFilterState] = useState<FilterState>({
        searchTerm: '',
        filterValues: {}
    });

    // Search trigger state
    const [searchTrigger, setSearchTrigger] = useState(0);

    // Update pagination data from API response
    const updatePaginationData = useCallback((data: {
        pageNumber: number;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }) => {
        setPaginationState({
            currentPage: data.pageNumber,
            pageSize: data.pageSize,
            totalPages: data.totalPages,
            totalRecords: data.totalRecords,
            hasNextPage: data.hasNextPage,
            hasPreviousPage: data.hasPreviousPage
        });
    }, []);

    // Page change handler
    const handlePageChange = useCallback((page: number) => {
        setPaginationState(prev => ({
            ...prev,
            currentPage: page
        }));
        setSearchTrigger(prev => prev + 1);
    }, []);

    // Page size change handler
    const handlePageSizeChange = useCallback((pageSize: number) => {
        setPaginationState(prev => ({
            ...prev,
            pageSize,
            currentPage: 1 // Reset to first page when changing page size
        }));
        setSearchTrigger(prev => prev + 1);
    }, []);

    // Search term change handler (local state only)
    const handleSearchTermChange = useCallback((searchTerm: string) => {
        setFilterState(prev => ({
            ...prev,
            searchTerm
        }));
    }, []);

    // Search trigger handler
    const handleSearch = useCallback(() => {
        setSearchTrigger(prev => prev + 1);
    }, []);

    // Filter change handler
    const handleFilterChange = useCallback((key: string, value: string) => {
        setFilterState(prev => ({
            ...prev,
            filterValues: {
                ...prev.filterValues,
                [key]: value
            }
        }));
    }, []);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setFilterState({
            searchTerm: '',
            filterValues: {}
        });
        setSearchTrigger(prev => prev + 1);
    }, []);

    // Get current search parameters
    const getSearchParams = useCallback(() => {
        // Filter out empty and 'all' values
        const filteredValues = Object.entries(filterState.filterValues).reduce((acc, [key, value]) => {
            if (value && value !== 'all') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, string>);

        return {
            pageNumber: paginationState.currentPage,
            pageSize: paginationState.pageSize,
            searchTerm: filterState.searchTerm,
            ...filteredValues
        };
    }, [paginationState.currentPage, paginationState.pageSize, filterState]);

    // Reset pagination
    const resetPagination = useCallback(() => {
        setPaginationState({
            currentPage: initialPage,
            pageSize: initialPageSize,
            totalPages: 0,
            totalRecords: 0,
            hasNextPage: false,
            hasPreviousPage: false
        });
    }, [initialPage, initialPageSize]);

    return {
        // State
        pagination: paginationState,
        filters: filterState,
        searchTrigger,

        // Actions
        handlePageChange,
        handlePageSizeChange,
        handleSearchTermChange,
        handleSearch,
        handleFilterChange,
        handleClearFilters,
        updatePaginationData,
        resetPagination,
        getSearchParams,

        // Computed values
        pageSizeOptions,
        hasActiveFilters: Object.values(filterState.filterValues).some(value => value !== '' && value !== 'all') || filterState.searchTerm !== ''
    };
}; 