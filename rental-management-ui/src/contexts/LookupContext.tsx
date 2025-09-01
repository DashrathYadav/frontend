import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { lookupApi } from '../services/api';
import { useAuth } from './AuthContext';
import type { AllLookupsResponse, LookupData } from '../types';

interface LookupContextType {
  lookups: AllLookupsResponse;
  isLoading: boolean;
  error: string | null;
  
  // Helper functions to get labels from IDs
  getCountryName: (id: number | string) => string;
  getStateName: (id: number | string) => string;
  getCurrencyName: (id: number | string) => string;
  getPropertyTypeName: (id: number | string) => string;
  getRoomTypeName: (id: number | string) => string;
  getAvailabilityStatusName: (id: number | string) => string;
  getRentStatusName: (id: number | string) => string;
  getRoleName: (id: number | string) => string;
  
  // Helper functions to get badge classes
  getAvailabilityStatusBadgeClass: (id: number | string) => string;
  getRentStatusBadgeClass: (id: number | string) => string;
  
  // Refresh function
  refreshLookups: () => Promise<void>;
  
  // Retry function
  retryLookups: () => void;
}

const LookupContext = createContext<LookupContextType | undefined>(undefined);

const defaultLookups: AllLookupsResponse = {
  propertyTypes: [],
  currencies: [],
  availabilityStatuses: [],
  roomTypes: [],
  states: [],
  countries: [],
  rentStatuses: [],
  roles: []
};

// Badge class mappings for status lookups with safe fallbacks
const getStatusBadgeClass = (lookups: LookupData[], id: number | string): string => {
  if (!lookups || lookups.length === 0) return 'secondary';
  if (!id && id !== 0) return 'secondary';
  
  const lookup = lookups.find(item => item.id === id.toString());
  if (!lookup) return 'secondary';
  
  // Default badge class mappings based on common status values
  const name = lookup.value.toLowerCase();
  if (name.includes('available')) return 'success';
  if (name.includes('pending') || name.includes('partial')) return 'warning';
  if (name.includes('paid') || name.includes('active')) return 'success';
  if (name.includes('overdue') || name.includes('not available')) return 'error';
  if (name.includes('maintenance')) return 'warning';
  
  return 'secondary';
};

export const LookupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [lookups, setLookups] = useState<AllLookupsResponse>(defaultLookups);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLookups = async (): Promise<void> => {
    // Only fetch lookups if user is authenticated
    if (!isAuthenticated || !user?.token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get cached data first
      const cachedData = localStorage.getItem('lookupData');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setLookups(parsed);
          setIsLoading(false);
        } catch (parseError) {
          console.warn('Failed to parse cached lookup data:', parseError);
        }
      }
      
      // Fetch fresh data from API only if authenticated
      const data = await lookupApi.getAll();
      setLookups(data);
      
      // Cache the data
      try {
        localStorage.setItem('lookupData', JSON.stringify(data));
      } catch (storageError) {
        console.warn('Failed to cache lookup data:', storageError);
      }
      
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
      setError('Failed to load lookup data');
      
      // If we have cached data, use it as fallback
      const cachedData = localStorage.getItem('lookupData');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setLookups(parsed);
          setError('Using cached data - some information may be outdated');
        } catch (parseError) {
          console.error('Failed to use cached lookup data:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, [isAuthenticated, user]);

  // Helper function to get label from lookup array with safe fallbacks
  const getLookupLabel = (lookupArray: LookupData[], id: number | string): string => {
    if (!lookupArray || lookupArray.length === 0) {
      return 'Loading...';
    }
    
    if (!id && id !== 0) {
      return 'N/A';
    }
    
    const stringId = id.toString();
    const lookup = lookupArray.find(item => item.id === stringId);
    
    return lookup?.value || `Unknown (${id})`;
  };

  const contextValue: LookupContextType = {
    lookups,
    isLoading,
    error,
    
    // Label getter functions
    getCountryName: (id) => getLookupLabel(lookups.countries, id),
    getStateName: (id) => getLookupLabel(lookups.states, id),
    getCurrencyName: (id) => getLookupLabel(lookups.currencies, id),
    getPropertyTypeName: (id) => getLookupLabel(lookups.propertyTypes, id),
    getRoomTypeName: (id) => getLookupLabel(lookups.roomTypes, id),
    getAvailabilityStatusName: (id) => getLookupLabel(lookups.availabilityStatuses, id),
    getRentStatusName: (id) => getLookupLabel(lookups.rentStatuses, id),
    getRoleName: (id) => getLookupLabel(lookups.roles, id),
    
    // Badge class getter functions
    getAvailabilityStatusBadgeClass: (id) => getStatusBadgeClass(lookups.availabilityStatuses, id),
    getRentStatusBadgeClass: (id) => getStatusBadgeClass(lookups.rentStatuses, id),
    
    // Refresh function
    refreshLookups: fetchLookups,
    
    // Retry function
    retryLookups: () => {
      fetchLookups();
    },
  };

  return <LookupContext.Provider value={contextValue}>{children}</LookupContext.Provider>;
};

export const useLookup = (): LookupContextType => {
  const context = useContext(LookupContext);
  if (context === undefined) {
    throw new Error('useLookup must be used within a LookupProvider');
  }
  return context;
};