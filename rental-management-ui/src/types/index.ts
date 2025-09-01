// API Response wrapper - matches actual backend structure
export interface ApiResponse<T> {
  status: boolean;
  responseCode: number;
  message: string;
  errors: string[] | null;
  data: T;
}



// Pagination types
export interface PagedResult<T> {
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Export pagination types
export * from './pagination';

// Address types
export interface Address {
  addressId: number;
  street: string;
  landMark: string;
  area: string;
  city: string;
  pincode: string;
  stateId: number;
  countryId: number;
}

export interface CreateAddressDto {
  street: string;
  landMark: string;
  area: string;
  city: string;
  pincode: string;
  stateId: number;
  countryId: number;
}

export interface UpdateAddressDto {
  street: string;
  landMark: string;
  area: string;
  city: string;
  pincode: string;
  stateId: number;
  countryId: number;
}

// Owner types
export interface Owner {
  ownerId: number;
  loginId: string;
  fullName: string;
  mobileNumber: string;
  phoneNumber?: string;
  email?: string;
  aadharNumber?: string;
  profilePic?: string;
  addressId: number;
  address: Address;
  roleId: number;
  note?: string;
  isActive: boolean;
}

export interface CreateOwnerDto {
  loginId: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  aadharNumber?: string;
  profilePic?: string;
  document?: string;
  address: CreateAddressDto;
  roleId: number;
  note: string;
}

export interface Property {
  propertyId: number;
  propertyName: string;
  propertySize: string;
  ownerId: number;
  ownerName: string;
  propertyRent: number;
  propertyValue: number;
  currencyId?: number;
  statusId: number;
  propertyPic?: string;
  propertyDescription: string;
  propertyFacility: string;
  propertyTypeId: number;
  address: Address;
  note?: string;
  creationDate: string;
  lastModificationDate?: string;
}

export interface PropertyOwnerContact {
  ownerId: number;
  fullName: string;
  mobileNumber: string;
  phoneNumber?: string;
  email?: string;
  profilePic?: string;
  isActive: boolean;
  note?: string;
}

export interface CreatePropertyDto {
  propertyName: string;
  propertyTypeId: number;
  propertySize: string;
  propertyRent: number;
  currencyId?: number;
  statusId: number;
  propertyPic?: string;
  propertyDescription: string;
  propertyFacility: string;
  ownerId: number;
  address: CreateAddressDto;
  note?: string;
}

export interface UpdatePropertyDto {
  propertyName: string;
  propertyTypeId: number;
  propertySize: string;
  propertyRent: number;
  currencyId?: number;
  statusId: number;
  propertyPic?: string;
  propertyDescription: string;
  propertyFacility: string;
  ownerId: number;
  address: UpdateAddressDto;
  note?: string;
}

export interface Room {
  roomId: number;
  roomNo: number;
  propertyId: number;
  propertyName: string;
  ownerId: number;
  ownerName: string;
  roomTypeId?: number;
  roomTypeName: string;
  roomSize?: string;
  roomRent: number;
  currencyId?: number;
  currencyName: string;
  currencySymbol: string;
  statusId: number;
  statusName: string;
  roomPic?: string;
  roomDescription?: string;
  roomFacility?: string;
  tenantLimit: number;
  currentTenantCount: number;
  note?: string;
  creationDate: string;
  lastModificationDate?: string;
}

export interface CreateRoomDto {
  roomNo: number;
  propertyId: number;
  ownerId: number;
  roomTypeId?: number;
  roomSize?: string;
  roomRent: number;
  currencyId?: number;
  statusId: number;
  roomPic?: string;
  roomDescription?: string;
  roomFacility?: string;
  tenantLimit: number;
  note?: string;
}

export interface UpdateRoomDto {
  roomNo: number;
  roomTypeId?: number;
  roomSize?: string;
  roomRent: number;
  currencyId?: number;
  statusId: number;
  roomPic?: string;
  roomDescription?: string;
  roomFacility?: string;
  tenantLimit: number;
  currentTenantCount: number;
  note?: string;
}

// Tenant types
export interface Tenant {
  tenantId: number;
  tenantName: string;
  tenantMobile: string;
  tenantEmail?: string;
  tenantAdharId: string;
  tenantProfilePic?: string;
  tenantDocument?: string;

  // Authentication fields (excluding Password for security)
  loginId: string;
  roleId: number;

  permanentAddressId: number;
  permanentAddress: Address;
  isActive: boolean;
  lockInPeriod: string;
  note?: string;
  deposited: number;
  depositToReturn: number;
  presentRentValue?: number;
  pastRentValue?: number;
  currencyId?: number;
  boardingDate: string;
  leavingDate?: string;
  ownerId: number;
  propertyId: number;
  roomId?: number;
  creationDate: string;
  lastModificationDate?: string;
}

export interface CreateTenantDto {
  tenantName: string;
  tenantMobile: string;
  tenantEmail?: string;
  tenantAdharId: string;
  tenantProfilePic?: string;
  tenantDocument?: string;

  // Authentication fields
  loginId: string;
  password: string;

  permanentAddress: CreateAddressDto;
  lockInPeriod: string;
  note?: string;
  deposited: number;
  presentRentValue?: number;
  pastRentValue?: number;
  currencyId?: number;
  boardingDate: string;
  ownerId: number;
  propertyId: number;
  roomId: number;
}

export interface UpdateTenantDto {
  tenantName: string;
  tenantMobile: string;
  tenantEmail?: string;
  tenantProfilePic?: string;
  tenantDocument?: string;
  lockInPeriod: string;
  note?: string;
  isActive: boolean;
  deposited: number;
  depositToReturn: number;
  presentRentValue?: number;
  pastRentValue?: number;
  currencyId?: number;
  boardingDate: string;
  leavingDate?: string;
  permanentAddress?: UpdateAddressDto;
}

// RentTrack types - matches API response structure
export interface RentTrack {
  rentTrackId: number;
  propertyId: number;
  roomId?: number;
  tenantId: number;
  ownerId: number;
  roomNo?: string;
  propertyName: string;
  tenantName: string;
  expectedRentValue?: number;
  receivedRentValue?: number;
  pendingAmount?: number;
  rentPeriodStartDate: string;
  rentPeriodEndDate: string;
  paymentReceivedDate?: string;
  statusId: number;
  note?: string;
  currencyId?: number;
  createdDate: string;
  lastModifiedDate: string;
}

export interface CreateRentTrackDto {
  propertyId: number;
  roomId?: number;
  tenantId: number;
  ownerId: number;
  expectedRentValue?: number;
  receivedRentValue?: number;
  pendingAmount?: number;
  rentPeriodStartDate: string;
  rentPeriodEndDate: string;
  paymentReceivedDate?: string;
  statusId: number;
  note?: string;
  currencyId?: number;
}

export interface UpdateRentTrackDto {
  expectedRentValue?: number;
  receivedRentValue?: number;
  pendingAmount?: number;
  rentPeriodStartDate: string;
  rentPeriodEndDate: string;
  paymentReceivedDate?: string;
  statusId: number;
  note?: string;
  currencyId?: number;
}

// Search request types
export interface PropertySearchRequest {
  searchTerm?: string;
  propertyTypeId?: number;
  city?: string;
  minRent?: number;
  maxRent?: number;
  statusId?: number;
  ownerId?: number;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface RoomSearchRequest {
  searchTerm?: string;
  roomTypeId?: number;
  minRent?: number;
  maxRent?: number;
  statusId?: number;
  propertyId?: number;
  ownerId?: number;
  minSize?: number;
  maxSize?: number;
  isAvailable?: boolean;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface TenantSearchRequest {
  searchTerm?: string;
  tenantName?: string;
  email?: string;
  mobileNumber?: string;
  propertyId?: number;
  roomNumber?: number;
  ownerId?: number;
  isActive?: boolean;
  minRent?: number;
  maxRent?: number;
  boardingDateFrom?: string;
  boardingDateTo?: string;
  leavingDateFrom?: string;
  leavingDateTo?: string;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface RentTrackSearchRequest {
  searchTerm?: string;
  propertyId?: number;
  roomId?: number;
  tenantId?: number;
  ownerId?: number;
  minExpectedRent?: number;
  maxExpectedRent?: number;
  minReceivedRent?: number;
  maxReceivedRent?: number;
  rentPeriodStartFrom?: string;
  rentPeriodStartTo?: string;
  rentPeriodEndFrom?: string;
  rentPeriodEndTo?: string;
  statusId?: number;
  currencyId?: number;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
}

// Lookup types - matches API response structure
export interface LookupData {
  id: string;
  value: string;
  description?: string;
}

export interface LookupResponse {
  data: LookupData[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

// All lookups response interface for /lookups/all endpoint
export interface AllLookupsResponse {
  propertyTypes: LookupData[];
  currencies: LookupData[];
  availabilityStatuses: LookupData[];
  roomTypes: LookupData[];
  states: LookupData[];
  countries: LookupData[];
  rentStatuses: LookupData[];
  roles: LookupData[];
}

// Dashboard stats
export interface DashboardStats {
  totalOwners: number;
  totalProperties: number;
  totalRooms: number;
  totalTenants: number;
}