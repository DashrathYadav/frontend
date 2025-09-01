import { useEffect } from 'react';
import { useLookup } from '../contexts/LookupContext';
import { setCurrencySymbolResolver } from '../utils/formatters';

// Hook to initialize dynamic currency symbol resolver
export const useCurrencyFormatter = () => {
  const { lookups } = useLookup();

  useEffect(() => {
    // Create a currency symbol resolver using dynamic lookup data
    const currencySymbolResolver = (currencyId: string | number): string => {
      const currency = lookups.currencies.find(c => c.id === currencyId.toString());
      
      if (currency) {
        // Map currency codes to symbols
        const symbolMap: Record<string, string> = {
          'USD': '$',
          'EUR': '€', 
          'GBP': '£',
          'AUD': 'A$',
          'CAD': 'C$',
          'JPY': '¥',
          'CNY': '¥',
          'INR': '₹',
          'RUB': '₽',
          'BRL': 'R$',
        };
        
        return symbolMap[currency.value] || currency.value || '₹';
      }
      
      // Fallback to default behavior
      return '₹';
    };

    // Set the resolver for the formatters
    setCurrencySymbolResolver(currencySymbolResolver);
  }, [lookups.currencies]);
};