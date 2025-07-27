# Frontend Pagination System

This document describes the standardized pagination system implemented for the frontend, mirroring the backend's `PaginationHelper` approach.

## Overview

The frontend pagination system provides:
- **Centralized Configuration**: All pagination settings in one place
- **Type-Safe Hooks**: Custom React hooks for different pagination scenarios
- **Consistent Validation**: Automatic parameter validation and normalization
- **Enhanced UI Components**: Rich pagination components with additional features
- **Configuration-Driven**: Easy to adjust limits and defaults

## Architecture

```
src/
├── constants/
│   └── pagination.ts          # Pagination configuration constants
├── types/
│   └── pagination.ts          # TypeScript interfaces
├── utils/
│   └── pagination.ts          # Utility functions (validation, normalization)
├── hooks/
│   └── usePagination.ts       # Custom pagination hooks
└── components/
    └── PaginationEnhanced.tsx # Enhanced pagination component
```

## Configuration

### Pagination Types

The system supports different pagination types optimized for different use cases:

```typescript
PAGINATION_TYPES = {
  LOOKUP: 'lookup',    // For dropdowns, large datasets (up to 1000 items)
  SEARCH: 'search',    // For search results (up to 100 items)
  GRID: 'grid',        // For grid layouts (up to 100 items)
  TABLE: 'table'       // For table layouts (up to 50 items)
}
```

### Default Settings

```typescript
PAGINATION_CONFIG = {
  DEFAULT_PAGE_INDEX: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  
  // Type-specific defaults
  DEFAULT_LOOKUP_PAGE_SIZE: 50,
  MAX_LOOKUP_PAGE_SIZE: 1000,
  DEFAULT_SEARCH_PAGE_SIZE: 25,
  MAX_SEARCH_PAGE_SIZE: 100,
  DEFAULT_GRID_PAGE_SIZE: 12,
  DEFAULT_TABLE_PAGE_SIZE: 20,
  MAX_TABLE_PAGE_SIZE: 50,
}
```

## Usage

### 1. Basic Pagination Hook

```typescript
import { usePagination } from '../hooks/usePagination';
import { PAGINATION_TYPES } from '../constants/pagination';

const MyComponent = () => {
  const pagination = usePagination({
    type: PAGINATION_TYPES.SEARCH
  });

  // Access pagination state
  const { pageNumber, pageSize, totalRecords } = pagination.pagination;
  
  // Use pagination actions
  const { setPage, setPageSize, nextPage, previousPage } = pagination.actions;
  
  // Update data from API response
  pagination.setData(apiResponse);
};
```

### 2. Type-Specific Hooks

```typescript
import { 
  useSearchPagination, 
  useGridPagination, 
  useTablePagination, 
  useLookupPagination 
} from '../hooks/usePagination';

// For search pages
const searchPagination = useSearchPagination();

// For grid layouts (like properties)
const gridPagination = useGridPagination();

// For table layouts
const tablePagination = useTablePagination();

// For lookup dropdowns
const lookupPagination = useLookupPagination();
```

### 3. Enhanced Pagination Component

```typescript
import PaginationEnhanced from '../components/PaginationEnhanced';

const MyListComponent = () => {
  const pagination = useGridPagination();

  return (
    <div>
      {/* Your content */}
      
      <PaginationEnhanced
        pagination={pagination.pagination}
        actions={pagination.actions}
        paginationType={PAGINATION_TYPES.GRID}
        showPageSizeSelector={true}
        showInfo={true}
        showFirstLast={true}
      />
    </div>
  );
};
```

### 4. Complete Example

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGridPagination } from '../hooks/usePagination';
import { PAGINATION_TYPES } from '../constants/pagination';
import PaginationEnhanced from '../components/PaginationEnhanced';

const PropertiesList = () => {
  // Use grid pagination for properties
  const pagination = useGridPagination();
  
  // Search parameters (excluding pagination)
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    propertyType: undefined
  });

  // Fetch data with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['properties', { ...searchParams, ...pagination.pagination }],
    queryFn: () => api.searchProperties({
      ...searchParams,
      pageNumber: pagination.pagination.pageNumber,
      pageSize: pagination.pagination.pageSize
    }),
    onSuccess: (response) => {
      // Update pagination state with API response
      pagination.setData(response);
    }
  });

  // Handle search changes
  const handleSearch = (searchTerm: string) => {
    setSearchParams(prev => ({ ...prev, searchTerm }));
    pagination.actions.setPage(1); // Reset to first page
  };

  return (
    <div>
      {/* Search and filters */}
      <input 
        value={searchParams.searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search properties..."
      />

      {/* Properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagination.data.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Enhanced pagination */}
      <PaginationEnhanced
        pagination={pagination.pagination}
        actions={pagination.actions}
        paginationType={PAGINATION_TYPES.GRID}
      />
    </div>
  );
};
```

## Features

### 1. Automatic Validation

The system automatically validates pagination parameters:

```typescript
// Invalid page number is automatically corrected
pagination.actions.setPage(-1); // Will be set to 1

// Invalid page size is automatically corrected
pagination.actions.setPageSize(1000); // Will be capped to max allowed
```

### 2. Type-Specific Limits

Different pagination types have different limits:

- **Lookup**: Up to 1000 items (for dropdowns)
- **Search**: Up to 100 items (for search results)
- **Grid**: Up to 100 items (for grid layouts)
- **Table**: Up to 50 items (for table layouts)

### 3. Enhanced UI Features

The `PaginationEnhanced` component includes:

- **Page Size Selector**: Users can choose items per page
- **Pagination Info**: Shows "Showing X to Y of Z records"
- **First/Last Buttons**: Quick navigation to first/last page
- **Loading States**: Disabled during API calls
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 4. Configuration Flexibility

Easy to adjust settings for different environments:

```typescript
// In constants/pagination.ts
export const PAGINATION_CONFIG = {
  // Adjust these values as needed
  DEFAULT_GRID_PAGE_SIZE: 12,  // Show 12 properties per page
  MAX_GRID_PAGE_SIZE: 48,      // Allow up to 48 properties per page
  // ...
};
```

## Migration Guide

### From Current Implementation

**Before:**
```typescript
const [searchParams, setSearchParams] = useState({
  pageNumber: 1,
  pageSize: 12,
  // ... other params
});

const handlePageChange = (page: number) => {
  setSearchParams(prev => ({ ...prev, pageNumber: page }));
};
```

**After:**
```typescript
const pagination = useGridPagination();
const [searchParams, setSearchParams] = useState({
  // ... other params (no pagination)
});

// Use pagination.actions.setPage(page) instead
```

### Benefits of Migration

1. **Consistency**: All components use the same pagination logic
2. **Maintainability**: Changes to pagination behavior in one place
3. **Type Safety**: TypeScript ensures correct usage
4. **Performance**: Optimized for different use cases
5. **User Experience**: Enhanced UI with more features
6. **Configuration**: Easy to adjust limits and defaults

## Best Practices

1. **Choose the Right Type**: Use appropriate pagination type for your use case
2. **Reset on Search**: Always reset to page 1 when search criteria change
3. **Handle Loading States**: Use `pagination.setLoading()` during API calls
4. **Error Handling**: Reset pagination state on API errors
5. **Accessibility**: Use the enhanced component for better accessibility
6. **Configuration**: Adjust page sizes based on your UI layout

## Comparison with Backend

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **Configuration** | `PaginationSettings` class | `PAGINATION_CONFIG` constants |
| **Validation** | `PaginationHelper.Normalize*()` | `normalizePagination()` utility |
| **Types** | `PaginationSettings` | `PaginationConfig` interface |
| **Usage** | Service injection | React hooks |
| **Limits** | Configurable via `appsettings.json` | Configurable via constants |

This creates a consistent pagination experience across the entire application stack. 