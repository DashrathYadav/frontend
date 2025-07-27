// ============================================================================
// CENTRALIZED CONSTANTS EXPORT
// ============================================================================
// All constants, enums, and utility functions are now centralized in app-constants.ts
// This file serves as the main entry point for all constants

export * from './app-constants';

// Legacy exports for backward compatibility (excluding duplicates)
// Note: API_ENDPOINTS and ROUTES are now centralized in app-constants.ts
export {
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
    DATE_FORMAT,
    DATE_TIME_FORMAT,
    API_DATE_FORMAT,
    CURRENCY_SYMBOLS,
    STATUS_COLORS,
    VALIDATION_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    STORAGE_KEYS
} from './common';
export * from './roles';
export * from './pagination'; 