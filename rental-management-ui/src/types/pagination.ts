import { PAGINATION_TYPES } from '../constants/pagination';

// Base pagination interface
export interface PaginationParams {
    pageNumber: number;
    pageSize: number;
}

// Extended pagination interface with sorting
export interface PaginationRequest extends PaginationParams {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

// Pagination response interface
export interface PaginationResponse<T> {
    data: T[];
    totalRecords: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Pagination configuration interface
export interface PaginationConfig {
    type: keyof typeof PAGINATION_TYPES;
    defaultPageSize?: number;
    maxPageSize?: number;
    pageSizeOptions?: number[];
}

// Pagination state interface for hooks
export interface PaginationState {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isLoading: boolean;
}

// Pagination actions interface
export interface PaginationActions {
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
    reset: () => void;
}

// Pagination hook return type
export interface UsePaginationReturn<T> {
    data: T[];
    pagination: PaginationState;
    actions: PaginationActions;
    setData: (data: PaginationResponse<T>) => void;
    setLoading: (loading: boolean) => void;
} 