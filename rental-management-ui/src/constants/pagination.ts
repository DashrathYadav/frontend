// Pagination configuration constants
// These mirror the backend PaginationSettings for consistency

export const PAGINATION_CONFIG = {
    // Default values
    DEFAULT_PAGE_INDEX: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1,

    // Lookup-specific settings (for dropdowns, etc.)
    DEFAULT_LOOKUP_PAGE_SIZE: 50,
    MAX_LOOKUP_PAGE_SIZE: 1000,

    // Search-specific settings (for list pages)
    DEFAULT_SEARCH_PAGE_SIZE: 25,
    MAX_SEARCH_PAGE_SIZE: 100,

    // UI-specific settings
    DEFAULT_GRID_PAGE_SIZE: 12, // For grid layouts like properties
    DEFAULT_TABLE_PAGE_SIZE: 20, // For table layouts
    MAX_TABLE_PAGE_SIZE: 50,
} as const;

// Pagination types for different use cases
export const PAGINATION_TYPES = {
    LOOKUP: 'lookup',
    SEARCH: 'search',
    GRID: 'grid',
    TABLE: 'table',
} as const;

// Page size options for user selection
export const PAGE_SIZE_OPTIONS = {
    [PAGINATION_TYPES.LOOKUP]: [10, 25, 50, 100, 500, 1000],
    [PAGINATION_TYPES.SEARCH]: [10, 25, 50, 100],
    [PAGINATION_TYPES.GRID]: [6, 12, 24, 48],
    [PAGINATION_TYPES.TABLE]: [10, 20, 50, 100],
} as const;

// Default page sizes for each type
export const DEFAULT_PAGE_SIZES = {
    [PAGINATION_TYPES.LOOKUP]: PAGINATION_CONFIG.DEFAULT_LOOKUP_PAGE_SIZE,
    [PAGINATION_TYPES.SEARCH]: PAGINATION_CONFIG.DEFAULT_SEARCH_PAGE_SIZE,
    [PAGINATION_TYPES.GRID]: PAGINATION_CONFIG.DEFAULT_GRID_PAGE_SIZE,
    [PAGINATION_TYPES.TABLE]: PAGINATION_CONFIG.DEFAULT_TABLE_PAGE_SIZE,
} as const;

// Maximum page sizes for each type
export const MAX_PAGE_SIZES = {
    [PAGINATION_TYPES.LOOKUP]: PAGINATION_CONFIG.MAX_LOOKUP_PAGE_SIZE,
    [PAGINATION_TYPES.SEARCH]: PAGINATION_CONFIG.MAX_SEARCH_PAGE_SIZE,
    [PAGINATION_TYPES.GRID]: PAGINATION_CONFIG.MAX_PAGE_SIZE,
    [PAGINATION_TYPES.TABLE]: PAGINATION_CONFIG.MAX_TABLE_PAGE_SIZE,
} as const; 