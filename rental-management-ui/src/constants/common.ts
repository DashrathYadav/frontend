// Common constants for the application

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// Date formats
export const DATE_FORMAT = 'dd MMM yyyy';
export const DATE_TIME_FORMAT = 'dd MMM yyyy HH:mm';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
    '1': '$', // USD
    '2': '€', // EUR
    '3': '£', // GBP
    '4': 'A$', // AUD
    '5': 'C$', // CAD
    '6': '¥', // JPY
    '7': '¥', // CNY
    '8': '₹', // INR
    '9': '₽', // RUB
    '10': 'R$', // BRL
};

// Status colors for badges
export const STATUS_COLORS = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
} as const;

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
    },
    DASHBOARD: {
        STATS: '/dashboard/stats',
    },
    PROPERTIES: {
        SEARCH: '/property/search',
        CREATE: '/property/create',
        GET_BY_ID: (id: number) => `/property/${id}`,
        UPDATE: (id: number) => `/property/${id}`,
        GET_BY_OWNER: (ownerId: number) => `/property/owner/${ownerId}`,
    },
    ROOMS: {
        SEARCH: '/room/search',
        CREATE: '/room/create',
        GET_BY_ID: (id: number) => `/room/${id}`,
        UPDATE: (id: number) => `/room/${id}`,
        GET_BY_PROPERTY: (propertyId: number) => `/room/property/${propertyId}/search`,
        GET_BY_OWNER: (ownerId: number) => `/room/owner/${ownerId}/search`,
    },
    TENANTS: {
        SEARCH: '/tenant/search',
        CREATE: '/tenant/create',
        GET_BY_ID: (id: number) => `/tenant/${id}`,
        UPDATE: (id: number) => `/tenant/${id}`,
        GET_BY_PROPERTY: (propertyId: number) => `/tenant/property/${propertyId}`,
        GET_BY_OWNER: (ownerId: number) => `/tenant/owner/${ownerId}`,
    },
    RENT_TRACKS: {
        SEARCH: '/renttrack/search',
        CREATE: '/renttrack/create',
        GET_BY_ID: (id: number) => `/renttrack/${id}`,
        UPDATE: (id: number) => `/renttrack/${id}`,
        GET_BY_PROPERTY: (propertyId: number) => `/renttrack/property/${propertyId}`,
        GET_BY_TENANT: (tenantId: number) => `/renttrack/tenant/${tenantId}`,
        GET_BY_OWNER: (ownerId: number) => `/renttrack/owner/${ownerId}`,
    },
    OWNERS: {
        SEARCH: '/owner/search',
        CREATE: '/owner/create',
        GET_BY_ID: (id: number) => `/owner/${id}`,
        UPDATE: (id: number) => `/owner/${id}`,
    },
    LOOKUPS: {
        PROPERTY_TYPES: '/lookup/propertytypes',
        ROOM_TYPES: '/lookup/roomtypes',
        CURRENCIES: '/lookup/currencies',
        AVAILABILITY_STATUSES: '/lookup/availabilitystatuses',
        RENT_STATUSES: '/lookup/rentstatuses',
        COUNTRIES: '/lookup/countries',
        STATES: '/lookup/states',
        OWNERS: '/lookup/owners',
        PROPERTIES: '/lookup/properties',
        ROOMS: '/lookup/rooms',
    },
} as const;

// Validation rules
export const VALIDATION_RULES = {
    PASSWORD: {
        MIN_LENGTH: 6,
        MAX_LENGTH: 50,
        PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    PHONE: {
        PATTERN: /^[0-9]{10}$/,
    },
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PINCODE: {
        PATTERN: /^[0-9]{6}$/,
    },
    AADHAR: {
        PATTERN: /^[0-9]{12}$/,
    },
} as const;

// Error messages
export const ERROR_MESSAGES = {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid 10-digit phone number',
    INVALID_PINCODE: 'Please enter a valid 6-digit pincode',
    INVALID_AADHAR: 'Please enter a valid 12-digit Aadhar number',
    PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
    PASSWORD_TOO_LONG: `Password must not exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
    PASSWORD_PATTERN: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
    CREATED: 'Record created successfully',
    UPDATED: 'Record updated successfully',
    DELETED: 'Record deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
    LANGUAGE: 'language',
} as const;

// Route paths
export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    PROPERTIES: '/properties',
    PROPERTY_DETAILS: (id: number) => `/properties/${id}`,
    PROPERTY_EDIT: (id: number) => `/properties/${id}/edit`,
    PROPERTY_NEW: '/properties/new',
    ROOMS: '/rooms',
    ROOM_DETAILS: (id: number) => `/rooms/${id}`,
    ROOM_EDIT: (id: number) => `/rooms/${id}/edit`,
    ROOM_NEW: '/rooms/new',
    TENANTS: '/tenants',
    TENANT_DETAILS: (id: number) => `/tenants/${id}`,
    TENANT_EDIT: (id: number) => `/tenants/${id}/edit`,
    TENANT_NEW: '/tenants/new',
    RENT_TRACKS: '/rents',
    RENT_TRACK_DETAILS: (id: number) => `/rents/${id}`,
    RENT_TRACK_EDIT: (id: number) => `/rents/${id}/edit`,
    RENT_TRACK_NEW: '/rents/new',
    OWNERS: '/owners',
    OWNER_DETAILS: (id: number) => `/owners/${id}`,
    OWNER_EDIT: (id: number) => `/owners/${id}/edit`,
    OWNER_NEW: '/owners/new',
} as const; 