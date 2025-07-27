import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterField {
    key: string;
    label: string;
    options: FilterOption[];
    placeholder?: string;
}

interface EnhancedFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
    filters?: FilterField[];
    filterValues: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    placeholder?: string;
    children?: React.ReactNode;
}

const EnhancedFilterBar: React.FC<EnhancedFilterBarProps> = ({
    searchTerm,
    onSearchChange,
    onSearch,
    filters = [],
    filterValues,
    onFilterChange,
    onClearFilters,
    placeholder = "Search...",
    children
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    // Debug filter values
    console.log('EnhancedFilterBar - filterValues:', filterValues);

    const handleSearch = () => {
        onSearchChange(localSearchTerm);
        onSearch();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const hasActiveFilters = Object.values(filterValues).some(value => value !== '' && value !== 'all');

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="space-y-6">
                {/* Search and Action Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleSearch} className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Search
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={onClearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters Row */}
                {(filters.length > 0 || children) && (
                    <div className="flex flex-wrap gap-4 min-w-0">
                        {filters.map((filter) => (
                            <div key={filter.key} className="flex items-center gap-3 flex-shrink-0">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
                                    {filter.label}:
                                </label>
                                <Select
                                    key={`${filter.key}-${filterValues[filter.key] || 'empty'}`}
                                    value={filterValues[filter.key] || ''}
                                    onValueChange={(value) => {
                                        console.log(`Filter ${filter.key} changed from ${filterValues[filter.key]} to ${value}`);
                                        onFilterChange(filter.key, value);
                                    }}
                                >
                                    <SelectTrigger className="w-48 flex-shrink-0">
                                        <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All {filter.label}</SelectItem>
                                        {filter.options.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}

                        {children && (
                            <div className="flex items-center gap-3">
                                {children}
                            </div>
                        )}
                    </div>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {Object.entries(filterValues).map(([key, value]) => {
                            if (!value || value === 'all') return null;
                            const filter = filters.find(f => f.key === key);
                            const option = filter?.options.find(opt => opt.value === value);
                            return (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                >
                                    {filter?.label}: {option?.label || value}
                                    <button
                                        onClick={() => onFilterChange(key, 'all')}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedFilterBar; 