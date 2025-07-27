import {
    PAGINATION_CONFIG,
    PAGINATION_TYPES,
    DEFAULT_PAGE_SIZES,
    MAX_PAGE_SIZES
} from '../constants/pagination';
import { PaginationParams, PaginationConfig } from '../types/pagination';

/**
 * Normalizes pagination parameters based on the pagination type
 * Similar to backend PaginationHelper.NormalizePagination()
 */
export function normalizePagination(
    pageNumber?: number,
    pageSize?: number,
    type: keyof typeof PAGINATION_TYPES = PAGINATION_TYPES.SEARCH
): { pageNumber: number; pageSize: number } {
    const normalizedPageNumber = pageNumber ?? PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
    const defaultPageSize = DEFAULT_PAGE_SIZES[type];
    const maxPageSize = MAX_PAGE_SIZES[type];

    let normalizedPageSize = pageSize ?? defaultPageSize;

    // Ensure page number is at least 1
    if (normalizedPageNumber < 1) {
        normalizedPageSize = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
    }

    // Ensure page size is within bounds
    if (normalizedPageSize < PAGINATION_CONFIG.MIN_PAGE_SIZE) {
        normalizedPageSize = PAGINATION_CONFIG.MIN_PAGE_SIZE;
    } else if (normalizedPageSize > maxPageSize) {
        normalizedPageSize = maxPageSize;
    }

    return { pageNumber: normalizedPageNumber, pageSize: normalizedPageSize };
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
    pageNumber: number,
    pageSize: number,
    type: keyof typeof PAGINATION_TYPES = PAGINATION_TYPES.SEARCH
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxPageSize = MAX_PAGE_SIZES[type];

    if (pageNumber < 1) {
        errors.push('Page number must be at least 1');
    }

    if (pageSize < PAGINATION_CONFIG.MIN_PAGE_SIZE) {
        errors.push(`Page size must be at least ${PAGINATION_CONFIG.MIN_PAGE_SIZE}`);
    }

    if (pageSize > maxPageSize) {
        errors.push(`Page size cannot exceed ${maxPageSize}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Calculates pagination metadata
 */
export function calculatePaginationMeta(
    totalRecords: number,
    pageNumber: number,
    pageSize: number
): {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startRecord: number;
    endRecord: number;
} {
    const totalPages = Math.ceil(totalRecords / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    const startRecord = (pageNumber - 1) * pageSize + 1;
    const endRecord = Math.min(pageNumber * pageSize, totalRecords);

    return {
        totalPages,
        hasNextPage,
        hasPreviousPage,
        startRecord,
        endRecord
    };
}

/**
 * Gets page size options for a specific pagination type
 */
export function getPageSizeOptions(type: keyof typeof PAGINATION_TYPES): number[] {
    const options = {
        [PAGINATION_TYPES.LOOKUP]: [10, 25, 50, 100, 500, 1000],
        [PAGINATION_TYPES.SEARCH]: [10, 25, 50, 100],
        [PAGINATION_TYPES.GRID]: [6, 12, 24, 48],
        [PAGINATION_TYPES.TABLE]: [10, 20, 50, 100],
    };

    return options[type] || options[PAGINATION_TYPES.SEARCH];
}

/**
 * Creates a pagination configuration object
 */
export function createPaginationConfig(
    type: keyof typeof PAGINATION_TYPES,
    overrides?: Partial<PaginationConfig>
): PaginationConfig {
    return {
        type,
        defaultPageSize: DEFAULT_PAGE_SIZES[type],
        maxPageSize: MAX_PAGE_SIZES[type],
        pageSizeOptions: getPageSizeOptions(type),
        ...overrides
    };
}

/**
 * Formats pagination info for display
 */
export function formatPaginationInfo(
    totalRecords: number,
    pageNumber: number,
    pageSize: number
): string {
    const { startRecord, endRecord } = calculatePaginationMeta(totalRecords, pageNumber, pageSize);

    if (totalRecords === 0) {
        return 'No records found';
    }

    if (totalRecords <= pageSize) {
        return `Showing ${totalRecords} of ${totalRecords} records`;
    }

    return `Showing ${startRecord} to ${endRecord} of ${totalRecords} records`;
} 