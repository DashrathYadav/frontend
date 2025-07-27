import axios from 'axios';
import type {
  ApiResponse,
  PagedResult,
  Owner,
  CreateOwnerDto,
  Property,
  CreatePropertyDto,
  PropertySearchRequest,
  PropertyOwnerContact,
  Room,
  CreateRoomDto,
  RoomSearchRequest,
  Tenant,
  CreateTenantDto,
  TenantSearchRequest,
  RentTrack,
  CreateRentTrackDto,
  RentTrackSearchRequest,
  LookupResponse,
  DashboardStats
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5268/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Handle 204 No Content responses (CORS preflight or actual no content)
    if (response.status === 204) {
      console.log('Received 204 No Content for:', response.config.url, 'Method:', response.config.method);
      // Return empty data structure for 204 responses
      return {
        ...response,
        data: {
          status: true,
          responseCode: 204,
          message: 'No content available',
          errors: null,
          data: {
            data: [],
            totalCount: 0,
            pageIndex: 1,
            pageSize: 1000
          }
        }
      };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Owner API
export const ownerApi = {
  getAll: async (): Promise<Owner[]> => {
    const response = await api.get<ApiResponse<LookupResponse>>('/lookups/owners?pageSize=1000');
    return response.data.data.data.map(item => ({
      ownerId: parseInt(item.id),
      loginId: '',
      fullName: item.value,
      mobileNumber: '',
      email: item.description,
      addressId: 0,
      address: {} as any,
      roleId: 0,
      isActive: true
    }));
  },

  getById: async (id: number): Promise<Owner> => {
    const response = await api.get<ApiResponse<Owner>>(`/owner/${id}`);
    return response.data.data;
  },

  create: async (data: CreateOwnerDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/owner/create', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateOwnerDto>): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/owner/${id}`, data);
    return response.data.data;
  }
};

// Property API
export const propertyApi = {
  search: async (params: PropertySearchRequest): Promise<PagedResult<Property>> => {
    try {
      const response = await api.get<ApiResponse<PagedResult<Property>>>('/property/search', { params });
      console.log('Property search response:', response.data);
      return response.data.data || {
        data: [],
        totalRecords: 0,
        pageNumber: 1,
        pageSize: 12,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      };
    } catch (error) {
      console.error('Property search error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Property> => {
    const response = await api.get<ApiResponse<Property>>(`/property/${id}`);
    return response.data.data;
  },

  getByOwnerId: async (ownerId: number): Promise<Property[]> => {
    const response = await api.get<ApiResponse<Property[]>>(`/property/owner/${ownerId}`);
    return response.data.data;
  },

  getOwnerContact: async (propertyId: number): Promise<PropertyOwnerContact> => {
    const response = await api.get<ApiResponse<PropertyOwnerContact>>(`/property/${propertyId}/owner-contact`);
    return response.data.data;
  },

  create: async (data: CreatePropertyDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/property/create', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreatePropertyDto>): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/property/${id}`, data);
    return response.data.data;
  }
};

// Room API
export const roomApi = {
  search: async (params: RoomSearchRequest): Promise<PagedResult<Room>> => {
    const response = await api.get<ApiResponse<PagedResult<Room>>>('/room/search', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<Room> => {
    const response = await api.get<ApiResponse<Room>>(`/room/${id}`);
    return response.data.data;
  },

  getByPropertyId: async (propertyId: number, params?: Partial<RoomSearchRequest>): Promise<PagedResult<Room>> => {
    const searchParams = { ...params, pageNumber: params?.pageNumber || 1, pageSize: params?.pageSize || 10 };
    const response = await api.get<ApiResponse<PagedResult<Room>>>(`/room/property/${propertyId}/search`, { params: searchParams });
    return response.data.data;
  },

  getByOwnerId: async (ownerId: number, params?: Partial<RoomSearchRequest>): Promise<PagedResult<Room>> => {
    const searchParams = { ...params, pageNumber: params?.pageNumber || 1, pageSize: params?.pageSize || 10 };
    const response = await api.get<ApiResponse<PagedResult<Room>>>(`/room/owner/${ownerId}/search`, { params: searchParams });
    return response.data.data;
  },

  create: async (data: CreateRoomDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/room/create', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateRoomDto>): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/room/${id}`, data);
    return response.data.data;
  }
};

// Tenant API
export const tenantApi = {
  search: async (params: TenantSearchRequest): Promise<PagedResult<Tenant>> => {
    const response = await api.get<ApiResponse<PagedResult<Tenant>>>('/tenant/search', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<Tenant> => {
    const response = await api.get<ApiResponse<Tenant>>(`/tenant/${id}`);
    return response.data.data;
  },

  getByPropertyId: async (propertyId: number): Promise<Tenant[]> => {
    const response = await api.get<ApiResponse<Tenant[]>>(`/tenant/property/${propertyId}`);
    return response.data.data;
  },

  getByOwnerId: async (ownerId: number): Promise<Tenant[]> => {
    const response = await api.get<ApiResponse<Tenant[]>>(`/tenant/owner/${ownerId}`);
    return response.data.data;
  },

  create: async (data: CreateTenantDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/tenant/create', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateTenantDto>): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/tenant/${id}`, data);
    return response.data.data;
  }
};

// RentTrack API
export const rentTrackApi = {
  search: async (params: RentTrackSearchRequest): Promise<PagedResult<RentTrack>> => {
    const response = await api.post<ApiResponse<PagedResult<RentTrack>>>('/renttrack/search', params);
    return response.data.data;
  },

  getById: async (id: number): Promise<RentTrack> => {
    const response = await api.get<ApiResponse<RentTrack>>(`/renttrack/${id}`);
    return response.data.data;
  },

  getByPropertyId: async (propertyId: number): Promise<RentTrack[]> => {
    const response = await api.get<ApiResponse<RentTrack[]>>(`/renttrack/property/${propertyId}`);
    return response.data.data;
  },

  getByTenantId: async (tenantId: number): Promise<RentTrack[]> => {
    const response = await api.get<ApiResponse<RentTrack[]>>(`/renttrack/tenant/${tenantId}`);
    return response.data.data;
  },

  getByOwnerId: async (ownerId: number): Promise<RentTrack[]> => {
    const response = await api.get<ApiResponse<RentTrack[]>>(`/renttrack/owner/${ownerId}`);
    return response.data.data;
  },

  create: async (data: CreateRentTrackDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/renttrack/create', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateRentTrackDto>): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/renttrack/${id}`, data);
    return response.data.data;
  }
};

// Lookup API
export const lookupApi = {
  getOwners: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/owners?pageSize=1000');
      console.log('Owners lookup response:', response.data);
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch owners lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getProperties: async (ownerId?: number): Promise<LookupResponse> => {
    try {
      const params = ownerId ? { ownerId, pageSize: 1000 } : { pageSize: 1000 };
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/properties', { params });
      console.log('Properties lookup response:', response.data);
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch properties lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getRoomsByProperty: async (propertyId: number): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>(`/lookups/rooms?propertyId=${propertyId}&pageSize=1000`);
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch rooms lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getTenants: async (ownerId?: number): Promise<LookupResponse> => {
    try {
      const params = ownerId ? { ownerId, pageSize: 1000 } : { pageSize: 1000 };
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/tenants', { params });
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch tenants lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getPropertyTypes: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/property-types');
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch property types lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getRoomTypes: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/room-types');
      console.log('Room types lookup response:', response.data);
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch room types lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getCurrencies: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/currencies');
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch currencies lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getAvailabilityStatuses: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/availability-status');
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch availability statuses lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getStates: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/states');
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch states lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getCountries: async (): Promise<LookupResponse> => {
    try {
      const response = await api.get<ApiResponse<LookupResponse>>('/lookups/countries');
      return response.data.data || { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    } catch (error) {
      console.warn('Failed to fetch countries lookup:', error);
      return { data: [], totalCount: 0, pageIndex: 1, pageSize: 1000 };
    }
  },

  getAll: async () => {
    try {
      const response = await api.get('/lookups/all');
      return response.data.data;
    } catch (error) {
      console.warn('Failed to fetch all lookups:', error);
      return {};
    }
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  }
};

export default api;