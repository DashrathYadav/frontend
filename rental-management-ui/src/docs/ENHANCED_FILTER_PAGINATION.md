# Enhanced Filter and Pagination System

This document describes the new enhanced filter and pagination system that provides consistent behavior across all list pages in the application.

## 🎯 **Key Features**

### **1. Search Button Control**
- **Search only triggers when the Search button is clicked**
- **No automatic search on typing** - prevents excessive API calls
- **Enter key support** - users can press Enter to trigger search
- **Local search term state** - changes don't immediately affect the API

### **2. Enhanced Pagination Controls**
- **Page Size Selector**: Dropdown to choose items per page (6, 12, 24, 48)
- **Page Navigation**: Previous/Next buttons with page numbers
- **Direct Page Input**: "Go to page" input field for quick navigation
- **First/Last Page Buttons**: Quick navigation to first or last page
- **Records Info**: Shows "Showing X to Y of Z records"

### **3. Advanced Filtering**
- **Multiple Filter Types**: Dropdown filters for different criteria
- **Active Filter Display**: Shows active filters as removable badges
- **Clear All Filters**: One-click to clear all active filters
- **Filter Persistence**: Filters remain until manually cleared

### **4. Consistent UI/UX**
- **shadcn-ui Components**: Modern, accessible components
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error states
- **Empty States**: Helpful messages when no data found

## 🏗️ **Architecture**

### **Components Structure**
```
src/
├── components/
│   ├── ui/                    # shadcn-ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── pagination.tsx
│   ├── EnhancedFilterBar.tsx  # Main filter component
│   ├── EnhancedPagination.tsx # Main pagination component
│   └── ListPageWrapper.tsx    # Reusable page wrapper
├── hooks/
│   └── useEnhancedPagination.ts # State management hook
└── docs/
    └── ENHANCED_FILTER_PAGINATION.md
```

### **Data Flow**
```
User Input → Local State → Search Button → API Call → Update Pagination → Re-render
```

## 📖 **Usage Guide**

### **1. Basic Implementation**

```typescript
import { useEnhancedPagination } from '../hooks/useEnhancedPagination';
import ListPageWrapper from '../components/ListPageWrapper';

const MyListPage: React.FC = () => {
  // Initialize enhanced pagination
  const {
    pagination,
    filters,
    searchTrigger,
    handlePageChange,
    handlePageSizeChange,
    handleSearchTermChange,
    handleSearch,
    handleFilterChange,
    handleClearFilters,
    updatePaginationData,
    getSearchParams,
    hasActiveFilters
  } = useEnhancedPagination({
    initialPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48]
  });

  // Fetch data with search trigger
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-data', searchTrigger, getSearchParams()],
    queryFn: () => myApi.search(getSearchParams()),
    onSuccess: (data) => {
      updatePaginationData({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        totalRecords: data.totalRecords,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage
      });
    }
  });

  return (
    <ListPageWrapper
      title="My Items"
      subtitle="Manage your items"
      addButtonText="Add Item"
      addButtonUrl="/items/new"
      isLoading={isLoading}
      error={error}
      data={data?.data || []}
      totalRecords={pagination.totalRecords}
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      pageSize={pagination.pageSize}
      hasNextPage={pagination.hasNextPage}
      hasPreviousPage={pagination.hasPreviousPage}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      onSearchChange={handleSearchTermChange}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      searchTerm={filters.searchTerm}
      filterValues={filters.filterValues}
      placeholder="Search items..."
      hasActiveFilters={hasActiveFilters}
    >
      {/* Your content here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </ListPageWrapper>
  );
};
```

### **2. Adding Custom Filters**

```typescript
// Define filter options
const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    placeholder: 'Select Status'
  },
  {
    key: 'category',
    label: 'Category',
    options: categories.map(cat => ({
      value: cat.id.toString(),
      label: cat.name
    })),
    placeholder: 'Select Category'
  }
];

// Pass to ListPageWrapper
<ListPageWrapper
  // ... other props
  filters={filterOptions}
  // ... rest of props
>
```

### **3. Custom Empty State**

```typescript
import { Building2 } from 'lucide-react';

<ListPageWrapper
  // ... other props
  emptyStateIcon={Building2}
  emptyStateTitle="No properties found"
  emptyStateMessage="Get started by adding your first property."
  hasActiveFilters={hasActiveFilters}
>
```

## 🔧 **Configuration Options**

### **Pagination Settings**
```typescript
const paginationConfig = {
  initialPageSize: 12,        // Default items per page
  initialPage: 1,             // Starting page
  pageSizeOptions: [6, 12, 24, 48]  // Available page sizes
};
```

### **Filter Configuration**
```typescript
interface FilterField {
  key: string;              // Filter identifier
  label: string;            // Display label
  options: FilterOption[];  // Available options
  placeholder?: string;     // Placeholder text
}
```

## 🎨 **UI Components**

### **EnhancedFilterBar**
- **Search Input**: With search icon and Enter key support
- **Search Button**: Triggers the actual search
- **Filter Dropdowns**: Multiple filter types
- **Active Filters**: Removable filter badges
- **Clear Button**: Clears all active filters

### **EnhancedPagination**
- **Page Size Selector**: Dropdown for items per page
- **Records Info**: "Showing X to Y of Z records"
- **Navigation Buttons**: First, Previous, Next, Last
- **Page Numbers**: Clickable page numbers with ellipsis
- **Page Input**: Direct page number input

### **ListPageWrapper**
- **Header**: Title, subtitle, and add button
- **Filter Bar**: Integrated enhanced filter bar
- **Loading State**: Centered loading spinner
- **Error State**: Error message display
- **Empty State**: Customizable empty state
- **Pagination**: Integrated enhanced pagination

## 🔄 **Migration Guide**

### **From Old System to New System**

**Before (Old System):**
```typescript
const [searchParams, setSearchParams] = useState({
  pageNumber: 1,
  pageSize: 12,
  searchTerm: '',
  // ... other params
});

const handleSearchChange = (searchTerm: string) => {
  setSearchParams(prev => ({
    ...prev,
    searchTerm,
    pageNumber: 1
  }));
};

// Search triggers immediately on every change
```

**After (New System):**
```typescript
const {
  pagination,
  filters,
  searchTrigger,
  handleSearchTermChange,
  handleSearch,
  // ... other handlers
} = useEnhancedPagination();

// Search only triggers when button is clicked
const handleSearch = () => {
  // Triggers API call
};
```

### **Benefits of Migration**
1. **Better Performance**: No excessive API calls
2. **Better UX**: User controls when to search
3. **Consistent Behavior**: Same across all pages
4. **Modern UI**: shadcn-ui components
5. **Accessibility**: Proper ARIA labels and keyboard navigation

## 🚀 **Best Practices**

### **1. Search Button Placement**
- Always place the search button prominently
- Use consistent button styling
- Provide visual feedback on click

### **2. Filter Organization**
- Group related filters together
- Use clear, descriptive labels
- Provide helpful placeholder text

### **3. Pagination UX**
- Show current page clearly
- Provide multiple navigation options
- Display total records count

### **4. Loading States**
- Show loading spinner during API calls
- Disable interactive elements during loading
- Provide clear feedback on errors

### **5. Empty States**
- Use appropriate icons
- Provide helpful messages
- Include action buttons when relevant

## 🐛 **Troubleshooting**

### **Common Issues**

**1. Search not triggering**
- Check if `handleSearch` is called
- Verify `searchTrigger` is incrementing
- Ensure query key includes `searchTrigger`

**2. Filters not working**
- Verify filter keys match API parameters
- Check filter options are properly formatted
- Ensure `handleFilterChange` is connected

**3. Pagination not updating**
- Check `updatePaginationData` is called in `onSuccess`
- Verify API response structure matches expected format
- Ensure pagination state is properly managed

**4. UI not responsive**
- Check shadcn-ui components are properly installed
- Verify CSS classes are applied correctly
- Test on different screen sizes

## 📝 **API Requirements**

### **Expected API Response Structure**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### **Search Parameters**
```typescript
interface SearchParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  [key: string]: any; // Additional filter parameters
}
```

This enhanced system provides a consistent, user-friendly experience across all list pages while maintaining performance and accessibility standards. 