import { useState, useCallback, useMemo } from 'react';
import {
    PAGINATION_TYPES,
    DEFAULT_PAGE_SIZES
} from '../constants/pagination';
import {
    normalizePagination,
    validatePagination,
    calculatePaginationMeta
} from '../utils/pagination';
import {
    PaginationState,
    PaginationActions,
    PaginationResponse,
    UsePaginationReturn,
    PaginationConfig
} from '../types/pagination';

/**
 * Custom hook for managing pagination state and actions
 * Similar to backend PaginationHelper but for React components
 */
export function usePagination<T>(
    config: PaginationConfig,
    initialData?: PaginationResponse<T>
): UsePaginationReturn<T> {
    // Initialize pagination state
    const { pageNumber, pageSize } = normalizePagination(
        initialData?.pageNumber,
        initialData?.pageSize,
        config.type
    );

    const [paginationState, setPaginationState] = useState<PaginationState>({
        pageNumber,
        pageSize,
        totalRecords: initialData?.totalRecords ?? 0,
        totalPages: initialData?.totalPages ?? 0,
        hasNextPage: initialData?.hasNextPage ?? false,
        hasPreviousPage: initialData?.hasPreviousPage ?? false,
        isLoading: false
    });

    const [data, setDataState] = useState<T[]>(initialData?.data ?? []);

    // Pagination actions
    const actions: PaginationActions = useMemo(() => ({
        setPage: useCallback((page: number) => {
            const validation = validatePagination(page, paginationState.pageSize, config.type);
            if (!validation.isValid) {
                console.warn('Invalid page number:', validation.errors);
                return;
            }

            setPaginationState(prev => ({
                ...prev,
                pageNumber: page
            }));
        }, [paginationState.pageSize, config.type]),

        setPageSize: useCallback((size: number) => {
            const validation = validatePagination(paginationState.pageNumber, size, config.type);
            if (!validation.isValid) {
                console.warn('Invalid page size:', validation.errors);
                return;
            }

            setPaginationState(prev => ({
                ...prev,
                pageSize: size,
                pageNumber: 1 // Reset to first page when changing page size
            }));
        }, [paginationState.pageNumber, config.type]),

        nextPage: useCallback(() => {
            if (paginationState.hasNextPage) {
                actions.setPage(paginationState.pageNumber + 1);
            }
        }, [paginationState.hasNextPage, paginationState.pageNumber]),

        previousPage: useCallback(() => {
            if (paginationState.hasPreviousPage) {
                actions.setPage(paginationState.pageNumber - 1);
            }
        }, [paginationState.hasPreviousPage, paginationState.pageNumber]),

        goToFirstPage: useCallback(() => {
            actions.setPage(1);
        }, []),

        goToLastPage: useCallback(() => {
            actions.setPage(paginationState.totalPages);
        }, [paginationState.totalPages]),

        reset: useCallback(() => {
            const defaultPageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZES[config.type];
            setPaginationState(prev => ({
                ...prev,
                pageNumber: 1,
                pageSize: defaultPageSize
            }));
            setDataState([]);
        }, [config.defaultPageSize, config.type])
    }), [paginationState, config]);

    // Set data from API response
    const setData = useCallback((response: PaginationResponse<T>) => {
        const { totalPages, hasNextPage, hasPreviousPage } = calculatePaginationMeta(
            response.totalRecords,
            response.pageNumber,
            response.pageSize
        );

        setPaginationState(prev => ({
            ...prev,
            pageNumber: response.pageNumber,
            pageSize: response.pageSize,
            totalRecords: response.totalRecords,
            totalPages,
            hasNextPage,
            hasPreviousPage
        }));

        setDataState(response.data);
    }, []);

    // Set loading state
    const setLoading = useCallback((loading: boolean) => {
        setPaginationState(prev => ({
            ...prev,
            isLoading: loading
        }));
    }, []);

    return {
        data,
        pagination: paginationState,
        actions,
        setData,
        setLoading
    };
}

/**
 * Hook for managing search/filter pagination
 * Automatically resets to page 1 when filters change
 */
export function useSearchPagination<T>(
    config: PaginationConfig = { type: PAGINATION_TYPES.SEARCH }
) {
    const pagination = usePagination<T>(config);

    // Enhanced setData that handles search scenarios
    const setSearchData = useCallback((response: PaginationResponse<T>) => {
        pagination.setData(response);
    }, [pagination]);

    // Reset pagination when search criteria change
    const resetOnSearch = useCallback(() => {
        pagination.actions.setPage(1);
    }, [pagination.actions]);

    return {
        ...pagination,
        setSearchData,
        resetOnSearch
    };
}

/**
 * Hook for managing lookup pagination (dropdowns, etc.)
 * Optimized for larger datasets
 */
export function useLookupPagination<T>(
    config: PaginationConfig = { type: PAGINATION_TYPES.LOOKUP }
) {
    return usePagination<T>(config);
}

/**
 * Hook for managing grid pagination
 * Optimized for grid layouts
 */
export function useGridPagination<T>(
    config: PaginationConfig = { type: PAGINATION_TYPES.GRID }
) {
    return usePagination<T>(config);
}

/**
 * Hook for managing table pagination
 * Optimized for table layouts
 */
export function useTablePagination<T>(
    config: PaginationConfig = { type: PAGINATION_TYPES.TABLE }
) {
    return usePagination<T>(config);
} 