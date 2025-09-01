import { DATE_FORMAT, DATE_TIME_FORMAT } from '../constants';

// Dynamic currency mapping function that can be overridden
let getCurrencySymbol = (currencyId: string | number): string => {
  // Default fallback mapping
  const defaultSymbols: Record<string, string> = {
    '1': '$', '2': '€', '3': '£', '4': 'A$', '5': 'C$',
    '6': '¥', '7': '¥', '8': '₹', '9': '₽', '10': 'R$',
  };
  return defaultSymbols[currencyId.toString()] || '₹';
};

// Function to override the currency symbol resolver (for dynamic lookups)
export const setCurrencySymbolResolver = (resolver: (id: string | number) => string) => {
  getCurrencySymbol = resolver;
};

// Date formatting utilities
export const formatDate = (date: string | Date | null | undefined, format: string = DATE_FORMAT): string => {
    if (!date) {
        return 'N/A';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = dateObj.toLocaleDateString('en-GB', { month: 'short' });
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    switch (format) {
        case DATE_FORMAT:
            return `${day} ${month} ${year}`;
        case DATE_TIME_FORMAT:
            return `${day} ${month} ${year} ${hours}:${minutes}`;
        default:
            return dateObj.toLocaleDateString('en-GB');
    }
};

export const formatRelativeDate = (date: string | Date | null | undefined): string => {
    if (!date) {
        return 'N/A';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

// Currency formatting utilities
export const formatCurrency = (
    amount: number | null | undefined,
    currencyId: string | number = '8', // Default to INR
    locale: string = 'en-IN'
): string => {
    if (amount === null || amount === undefined) {
        return 'N/A';
    }
    const symbol = getCurrencySymbol(currencyId);

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: getCurrencyCode(currencyId),
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback formatting
        return `${symbol}${amount.toLocaleString()}`;
    }
};

export const formatCurrencyCompact = (
    amount: number | null | undefined,
    currencyId: string | number = '8'
): string => {
    if (amount === null || amount === undefined) {
        return 'N/A';
    }
    const symbol = getCurrencySymbol(currencyId);

    if (amount >= 10000000) {
        return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `${symbol}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }

    return `${symbol}${amount.toLocaleString()}`;
};

// Helper function to get currency code from currency ID
const getCurrencyCode = (currencyId: string | number): string => {
    const currencyMap: Record<string, string> = {
        '1': 'USD',
        '2': 'EUR',
        '3': 'GBP',
        '4': 'AUD',
        '5': 'CAD',
        '6': 'JPY',
        '7': 'CNY',
        '8': 'INR',
        '9': 'RUB',
        '10': 'BRL',
    };

    return currencyMap[currencyId.toString()] || 'INR';
};

// Phone number formatting
export const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return 'N/A';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    return phone;
};

// Aadhar number formatting
export const formatAadharNumber = (aadhar: string | null | undefined): string => {
    if (!aadhar) return 'N/A';
    
    const cleaned = aadhar.replace(/\D/g, '');

    if (cleaned.length === 12) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
    }

    return aadhar;
};

// Pincode formatting
export const formatPincode = (pincode: string | null | undefined): string => {
    if (!pincode) return 'N/A';
    
    const cleaned = pincode.replace(/\D/g, '');

    if (cleaned.length === 6) {
        return cleaned;
    }

    return pincode;
};

// Text truncation
export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Percentage formatting
export const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
};

// Number formatting with Indian numbering system
export const formatIndianNumber = (num: number): string => {
    const formatter = new Intl.NumberFormat('en-IN');
    return formatter.format(num);
};

// Capitalize first letter
export const capitalize = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert camelCase to Title Case
export const camelCaseToTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

// Generate initials from name
export const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'N/A';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
}; 