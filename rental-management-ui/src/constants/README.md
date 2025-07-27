# Constants and Enums System

## Overview

This document describes the centralized constants and enums system used throughout the application. All constants, enums, lookup data, and utility functions are now centralized in `app-constants.ts` to ensure consistency and maintainability.

## File Structure

```
src/constants/
├── app-constants.ts     # Main centralized constants file
├── index.ts            # Export file (entry point)
├── common.ts           # Legacy common constants
├── roles.ts            # Legacy role constants
├── pagination.ts       # Legacy pagination constants
├── enums.ts            # Legacy enums (deprecated)
├── lookups.ts          # Legacy lookups (deprecated)
└── README.md           # This documentation
```

## Usage

### Importing Constants

```typescript
// Import everything from the centralized location
import { 
  AvailabilityStatus, 
  getAvailabilityStatusValue, 
  getAvailabilityStatusBadgeClass,
  PAGINATION,
  API_ENDPOINTS 
} from '../constants';

// Or import specific enums
import { PropertyType, Currency, Roles } from '../constants';
```

## Enums

### PropertyType
```typescript
enum PropertyType {
  Apartment = 1,
  House = 2,
  Studio = 3,
  Condo = 4,
  Townhouse = 5,
  Commercial = 6,
  Office = 7,
  Warehouse = 8,
  Other = 9
}
```

### AvailabilityStatus
```typescript
enum AvailabilityStatus {
  Available = 1,
  NotAvailable = 2,
  Pending = 3,
  Rented = 4,
  Sold = 5,
  UnderMaintenance = 6
}
```

### Currency
```typescript
enum Currency {
  USD = 1,
  EUR = 2,
  GBP = 3,
  AUD = 4,
  CAD = 5,
  JPY = 6,
  CNY = 7,
  INR = 8,
  RUB = 9,
  BRL = 10
}
```

### RentStatus
```typescript
enum RentStatus {
  Pending = 1,
  PartiallyPaid = 2,
  FullyPaid = 3
}
```

### Roles
```typescript
enum Roles {
  Admin = 1,
  Owner = 2,
  Tenant = 3
}
```

### RoomType
```typescript
enum RoomType {
  MasterBedroom = 1,
  GuestBedroom = 2,
  Studio = 3,
  // ... (19 total types)
}
```

## Lookup Data

Each enum has corresponding lookup data with additional information:

```typescript
interface LookupData {
  id: string;
  value: string;
  description: string;
  badgeClass?: string; // For UI badge styling
}
```

### Available Lookups

- `PROPERTY_TYPE_LOOKUPS`
- `AVAILABILITY_STATUS_LOOKUPS`
- `CURRENCY_LOOKUPS`
- `RENT_STATUS_LOOKUPS`
- `ROOM_TYPE_LOOKUPS`
- `ROLES_LOOKUPS`
- `COUNTRY_LOOKUPS`
- `STATE_LOOKUPS`

## Utility Functions

### Generic Functions

```typescript
// Get the display value for any lookup
getLookupValue(lookups: LookupData[], id: string | number): string

// Get the description for any lookup
getLookupDescription(lookups: LookupData[], id: string | number): string

// Get the badge class for any lookup
getLookupBadgeClass(lookups: LookupData[], id: string | number): string

// Validate if an ID is valid for a lookup
isValidLookupId(lookups: LookupData[], id: string | number): boolean
```

### Specific Functions

For each lookup type, there are specific utility functions:

```typescript
// Property Type
getPropertyTypeValue(id: string | number): string
getPropertyTypeDescription(id: string | number): string
getPropertyTypeBadgeClass(id: string | number): string
isValidPropertyType(id: string | number): boolean

// Availability Status
getAvailabilityStatusValue(id: string | number): string
getAvailabilityStatusDescription(id: string | number): string
getAvailabilityStatusBadgeClass(id: string | number): string
isValidAvailabilityStatus(id: string | number): boolean

// Rent Status
getRentStatusValue(id: string | number): string
getRentStatusDescription(id: string | number): string
getRentStatusBadgeClass(id: string | number): string
isValidRentStatus(id: string | number): boolean

// Currency
getCurrencyValue(id: string | number): string
getCurrencyDescription(id: string | number): string
isValidCurrency(id: string | number): boolean

// Room Type
getRoomTypeValue(id: string | number): string
getRoomTypeDescription(id: string | number): string
isValidRoomType(id: string | number): boolean

// Role
getRoleValue(id: string | number): string
getRoleDescription(id: string | number): string
isValidRole(id: string | number): boolean

// Country
getCountryValue(id: string | number): string
getCountryDescription(id: string | number): string
isValidCountry(id: string | number): boolean

// State
getStateValue(id: string | number): string
getStateDescription(id: string | number): string
isValidState(id: string | number): boolean
```

## Constants

### Pagination
```typescript
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_PAGE_NUMBER: 1
} as const;
```

### API Endpoints
```typescript
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  DASHBOARD: {
    STATS: '/dashboard/stats'
  },
  PROPERTIES: {
    BASE: '/properties',
    SEARCH: '/properties/search'
  },
  // ... more endpoints
} as const;
```

### Routes
```typescript
const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROPERTIES: '/properties',
  PROPERTIES_NEW: '/properties/new',
  // ... more routes
} as const;
```

## Best Practices

### ✅ Do's

1. **Use enums for comparisons**
   ```typescript
   // ✅ Good
   if (property.status === AvailabilityStatus.Available) {
     // handle available property
   }
   ```

2. **Use utility functions for display**
   ```typescript
   // ✅ Good
   const statusLabel = getAvailabilityStatusValue(property.status);
   const badgeClass = getAvailabilityStatusBadgeClass(property.status);
   ```

3. **Use constants for configuration**
   ```typescript
   // ✅ Good
   const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
   const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
   ```

4. **Validate enum values**
   ```typescript
   // ✅ Good
   if (isValidAvailabilityStatus(property.status)) {
     // process valid status
   }
   ```

### ❌ Don'ts

1. **Don't use hardcoded values**
   ```typescript
   // ❌ Bad
   if (property.status === 1) {
     // handle available property
   }
   ```

2. **Don't hardcode display labels**
   ```typescript
   // ❌ Bad
   const statusLabel = property.status === 1 ? 'Available' : 'Not Available';
   ```

3. **Don't hardcode badge classes**
   ```typescript
   // ❌ Bad
   const badgeClass = property.status === 1 ? 'success' : 'secondary';
   ```

4. **Don't hardcode API endpoints**
   ```typescript
   // ❌ Bad
   const url = '/api/properties';
   ```

## Migration Guide

### From Hardcoded Values

**Before:**
```typescript
// Hardcoded status comparison
if (property.status === 1) {
  return 'Available';
} else if (property.status === 4) {
  return 'Rented';
}

// Hardcoded badge class
const badgeClass = property.status === 1 ? 'success' : 'secondary';
```

**After:**
```typescript
// Use enums and utility functions
import { AvailabilityStatus, getAvailabilityStatusValue, getAvailabilityStatusBadgeClass } from '../constants';

const statusLabel = getAvailabilityStatusValue(property.status);
const badgeClass = getAvailabilityStatusBadgeClass(property.status);
```

### From Legacy Constants

**Before:**
```typescript
import { getAvailabilityStatusValue } from '../constants/lookups';
```

**After:**
```typescript
import { getAvailabilityStatusValue } from '../constants';
```

## Benefits

1. **Type Safety**: Enums provide compile-time type checking
2. **Maintainability**: Single source of truth for all constants
3. **Consistency**: Uniform handling of lookup values across the application
4. **Extensibility**: Easy to add new enums and utility functions
5. **Documentation**: Self-documenting code with clear enum names
6. **Refactoring**: Easy to change values without hunting through code
7. **Internationalization**: Centralized place for display values

## Future Enhancements

1. **Internationalization**: Add support for multiple languages
2. **Dynamic Lookups**: Fetch lookup data from API instead of hardcoding
3. **Validation**: Add runtime validation for enum values
4. **Caching**: Cache lookup data for better performance
5. **TypeScript**: Add stricter typing for enum values 