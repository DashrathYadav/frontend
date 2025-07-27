// ============================================================================
// APPLICATION CONSTANTS - CENTRALIZED LOCATION
// ============================================================================

// ============================================================================
// ENUMS (Matching Backend Lookups)
// ============================================================================

export enum PropertyType {
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

export enum AvailabilityStatus {
    Available = 1,
    NotAvailable = 2,
    Pending = 3,
    Rented = 4,
    Sold = 5,
    UnderMaintenance = 6
}

export enum Currency {
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

export enum RentStatus {
    Pending = 1,
    PartiallyPaid = 2,
    FullyPaid = 3
}

export enum Roles {
    Admin = 1,
    Owner = 2,
    Tenant = 3
}

export enum RoomType {
    MasterBedroom = 1,
    GuestBedroom = 2,
    Studio = 3,
    PremiumStudio = 4,
    MicroStudio = 5,
    SingleRoom = 6,
    SharedRoom = 7,
    FamilyRoom = 8,
    ExecutiveSuite = 9,
    PenthouseMaster = 10,
    PenthouseSuite = 11,
    LoftRoom = 12,
    DuplexMaster = 13,
    CornerRoom = 14,
    EconomyRoom = 15,
    DeluxeRoom = 16,
    GardenViewRoom = 17,
    AccessibilityRoom = 18,
    Other = 19
}

export enum Country {
    India = 1,
    UnitedStates = 2,
    UnitedKingdom = 3,
    Canada = 4,
    Australia = 5,
    Germany = 6,
    France = 7,
    Japan = 8,
    Singapore = 9,
    UAE = 10
}

export enum State {
    Maharashtra = 1,
    Delhi = 2,
    Karnataka = 3,
    TamilNadu = 4,
    Gujarat = 5,
    Rajasthan = 6,
    WestBengal = 7,
    UttarPradesh = 8,
    Haryana = 9,
    Punjab = 10,
    AndhraPradesh = 11,
    Telangana = 12,
    Kerala = 13,
    Odisha = 14,
    MadhyaPradesh = 15,
    Bihar = 16,
    Jharkhand = 17,
    Assam = 18,
    HimachalPradesh = 19,
    Uttarakhand = 20,
    Goa = 21,
    JammuAndKashmir = 22,
    Chhattisgarh = 23,
    Tripura = 24,
    Manipur = 25,
    Meghalaya = 26,
    Nagaland = 27,
    Mizoram = 28,
    ArunachalPradesh = 29,
    Sikkim = 30
}

// ============================================================================
// LOOKUP DATA INTERFACES
// ============================================================================

export interface LookupData {
    id: string;
    value: string;
    description: string;
    badgeClass?: string; // For UI badge styling
}

// ============================================================================
// LOOKUP DATA ARRAYS
// ============================================================================

export const PROPERTY_TYPE_LOOKUPS: LookupData[] = [
    { id: PropertyType.Apartment.toString(), value: 'Apartment', description: 'Multi-unit residential building with shared facilities' },
    { id: PropertyType.House.toString(), value: 'House', description: 'Single-family residential property with private amenities' },
    { id: PropertyType.Studio.toString(), value: 'Studio', description: 'Compact single-room living space with integrated kitchen' },
    { id: PropertyType.Condo.toString(), value: 'Condo', description: 'Individually owned unit in a larger residential complex' },
    { id: PropertyType.Townhouse.toString(), value: 'Townhouse', description: 'Multi-level attached residential property' },
    { id: PropertyType.Commercial.toString(), value: 'Commercial', description: 'Property used for business or commercial activities' },
    { id: PropertyType.Office.toString(), value: 'Office', description: 'Professional workspace for business operations' },
    { id: PropertyType.Warehouse.toString(), value: 'Warehouse', description: 'Large storage or distribution facility' },
    { id: PropertyType.Other.toString(), value: 'Other', description: 'Property type not covered by standard categories' }
];

export const AVAILABILITY_STATUS_LOOKUPS: LookupData[] = [
    { id: AvailabilityStatus.Available.toString(), value: 'Available', description: 'Property is available for rent', badgeClass: 'success' },
    { id: AvailabilityStatus.NotAvailable.toString(), value: 'Not Available', description: 'Property is not available for rent', badgeClass: 'secondary' },
    { id: AvailabilityStatus.Pending.toString(), value: 'Pending', description: 'Property availability is pending', badgeClass: 'warning' },
    { id: AvailabilityStatus.Rented.toString(), value: 'Rented', description: 'Property is currently rented', badgeClass: 'info' },
    { id: AvailabilityStatus.Sold.toString(), value: 'Sold', description: 'Property has been sold', badgeClass: 'secondary' },
    { id: AvailabilityStatus.UnderMaintenance.toString(), value: 'Under Maintenance', description: 'Property is under maintenance', badgeClass: 'warning' }
];

export const CURRENCY_LOOKUPS: LookupData[] = [
    { id: Currency.USD.toString(), value: 'USD', description: 'US Dollar' },
    { id: Currency.EUR.toString(), value: 'EUR', description: 'Euro' },
    { id: Currency.GBP.toString(), value: 'GBP', description: 'British Pound' },
    { id: Currency.AUD.toString(), value: 'AUD', description: 'Australian Dollar' },
    { id: Currency.CAD.toString(), value: 'CAD', description: 'Canadian Dollar' },
    { id: Currency.JPY.toString(), value: 'JPY', description: 'Japanese Yen' },
    { id: Currency.CNY.toString(), value: 'CNY', description: 'Chinese Yuan' },
    { id: Currency.INR.toString(), value: 'INR', description: 'Indian Rupee' },
    { id: Currency.RUB.toString(), value: 'RUB', description: 'Russian Ruble' },
    { id: Currency.BRL.toString(), value: 'BRL', description: 'Brazilian Real' }
];

export const RENT_STATUS_LOOKUPS: LookupData[] = [
    { id: RentStatus.Pending.toString(), value: 'Pending', description: 'Rent payment is pending', badgeClass: 'error' },
    { id: RentStatus.PartiallyPaid.toString(), value: 'Partially Paid', description: 'Rent has been partially paid', badgeClass: 'warning' },
    { id: RentStatus.FullyPaid.toString(), value: 'Fully Paid', description: 'Rent has been fully paid', badgeClass: 'success' }
];

export const ROOM_TYPE_LOOKUPS: LookupData[] = [
    { id: RoomType.MasterBedroom.toString(), value: 'Master Bedroom', description: 'Master bedroom with premium amenities' },
    { id: RoomType.GuestBedroom.toString(), value: 'Guest Bedroom', description: 'Guest bedroom for visitors' },
    { id: RoomType.Studio.toString(), value: 'Studio', description: 'Compact single-room living space' },
    { id: RoomType.PremiumStudio.toString(), value: 'Premium Studio', description: 'Premium studio with enhanced features' },
    { id: RoomType.MicroStudio.toString(), value: 'Micro Studio', description: 'Micro studio for minimalist living' },
    { id: RoomType.SingleRoom.toString(), value: 'Single Room', description: 'Single occupancy room' },
    { id: RoomType.SharedRoom.toString(), value: 'Shared Room', description: 'Shared accommodation room' },
    { id: RoomType.FamilyRoom.toString(), value: 'Family Room', description: 'Family-friendly spacious room' },
    { id: RoomType.ExecutiveSuite.toString(), value: 'Executive Suite', description: 'Executive suite with business amenities' },
    { id: RoomType.PenthouseMaster.toString(), value: 'Penthouse Master', description: 'Luxury penthouse master bedroom' },
    { id: RoomType.PenthouseSuite.toString(), value: 'Penthouse Suite', description: 'Premium penthouse suite' },
    { id: RoomType.LoftRoom.toString(), value: 'Loft Room', description: 'High-ceiling loft room' },
    { id: RoomType.DuplexMaster.toString(), value: 'Duplex Master', description: 'Duplex master with multi-level design' },
    { id: RoomType.CornerRoom.toString(), value: 'Corner Room', description: 'Corner room with multiple windows' },
    { id: RoomType.EconomyRoom.toString(), value: 'Economy Room', description: 'Economy room for budget-conscious tenants' },
    { id: RoomType.DeluxeRoom.toString(), value: 'Deluxe Room', description: 'Deluxe room with premium amenities' },
    { id: RoomType.GardenViewRoom.toString(), value: 'Garden View Room', description: 'Garden view room with nature access' },
    { id: RoomType.AccessibilityRoom.toString(), value: 'Accessibility Room', description: 'Accessibility-friendly room' },
    { id: RoomType.Other.toString(), value: 'Other', description: 'Room type not covered by standard categories' }
];

export const ROLES_LOOKUPS: LookupData[] = [
    { id: Roles.Admin.toString(), value: 'Admin', description: 'System administrator with full access' },
    { id: Roles.Owner.toString(), value: 'Owner', description: 'Property owner with management access' },
    { id: Roles.Tenant.toString(), value: 'Tenant', description: 'Property tenant with limited access' }
];

export const COUNTRY_LOOKUPS: LookupData[] = [
    { id: Country.India.toString(), value: 'India', description: 'Republic of India' },
    { id: Country.UnitedStates.toString(), value: 'United States', description: 'United States of America' },
    { id: Country.UnitedKingdom.toString(), value: 'United Kingdom', description: 'United Kingdom of Great Britain and Northern Ireland' },
    { id: Country.Canada.toString(), value: 'Canada', description: 'Dominion of Canada' },
    { id: Country.Australia.toString(), value: 'Australia', description: 'Commonwealth of Australia' },
    { id: Country.Germany.toString(), value: 'Germany', description: 'Federal Republic of Germany' },
    { id: Country.France.toString(), value: 'France', description: 'French Republic' },
    { id: Country.Japan.toString(), value: 'Japan', description: 'State of Japan' },
    { id: Country.Singapore.toString(), value: 'Singapore', description: 'Republic of Singapore' },
    { id: Country.UAE.toString(), value: 'UAE', description: 'Federation of Seven Emirates' }
];

export const STATE_LOOKUPS: LookupData[] = [
    { id: State.Maharashtra.toString(), value: 'Maharashtra', description: 'Financial capital of India' },
    { id: State.Delhi.toString(), value: 'Delhi', description: 'National capital territory' },
    { id: State.Karnataka.toString(), value: 'Karnataka', description: 'IT hub of India' },
    { id: State.TamilNadu.toString(), value: 'Tamil Nadu', description: 'Cultural heritage state' },
    { id: State.Gujarat.toString(), value: 'Gujarat', description: 'Industrial powerhouse' },
    { id: State.Rajasthan.toString(), value: 'Rajasthan', description: 'Land of kings' },
    { id: State.WestBengal.toString(), value: 'West Bengal', description: 'Cultural capital' },
    { id: State.UttarPradesh.toString(), value: 'Uttar Pradesh', description: 'Most populous state' },
    { id: State.Haryana.toString(), value: 'Haryana', description: 'Agricultural state' },
    { id: State.Punjab.toString(), value: 'Punjab', description: 'Granary of India' },
    { id: State.AndhraPradesh.toString(), value: 'Andhra Pradesh', description: 'Rice bowl of India' },
    { id: State.Telangana.toString(), value: 'Telangana', description: 'Technology hub' },
    { id: State.Kerala.toString(), value: 'Kerala', description: 'God\'s own country' },
    { id: State.Odisha.toString(), value: 'Odisha', description: 'Temple state' },
    { id: State.MadhyaPradesh.toString(), value: 'Madhya Pradesh', description: 'Heart of India' },
    { id: State.Bihar.toString(), value: 'Bihar', description: 'Ancient cultural center' },
    { id: State.Jharkhand.toString(), value: 'Jharkhand', description: 'Mineral rich state' },
    { id: State.Assam.toString(), value: 'Assam', description: 'Gateway to Northeast' },
    { id: State.HimachalPradesh.toString(), value: 'Himachal Pradesh', description: 'Dev Bhoomi' },
    { id: State.Uttarakhand.toString(), value: 'Uttarakhand', description: 'Land of gods' },
    { id: State.Goa.toString(), value: 'Goa', description: 'Coastal paradise' },
    { id: State.JammuAndKashmir.toString(), value: 'Jammu and Kashmir', description: 'Paradise on earth' },
    { id: State.Chhattisgarh.toString(), value: 'Chhattisgarh', description: 'Rice bowl' },
    { id: State.Tripura.toString(), value: 'Tripura', description: 'Land of festivals' },
    { id: State.Manipur.toString(), value: 'Manipur', description: 'Jewel of India' },
    { id: State.Meghalaya.toString(), value: 'Meghalaya', description: 'Abode of clouds' },
    { id: State.Nagaland.toString(), value: 'Nagaland', description: 'Land of festivals' },
    { id: State.Mizoram.toString(), value: 'Mizoram', description: 'Land of blue mountains' },
    { id: State.ArunachalPradesh.toString(), value: 'Arunachal Pradesh', description: 'Land of dawn-lit mountains' },
    { id: State.Sikkim.toString(), value: 'Sikkim', description: 'Organic state' }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generic lookup utility functions
 */
export const getLookupValue = (lookups: LookupData[], id: string | number): string => {
    const lookup = lookups.find(item => item.id === id.toString());
    return lookup?.value || 'Unknown';
};

export const getLookupDescription = (lookups: LookupData[], id: string | number): string => {
    const lookup = lookups.find(item => item.id === id.toString());
    return lookup?.description || '';
};

export const getLookupBadgeClass = (lookups: LookupData[], id: string | number): string => {
    const lookup = lookups.find(item => item.id === id.toString());
    return lookup?.badgeClass || 'secondary';
};

export const isValidLookupId = (lookups: LookupData[], id: string | number): boolean => {
    return lookups.some(item => item.id === id.toString());
};

/**
 * Specific lookup utility functions
 */
export const getPropertyTypeValue = (id: string | number): string => getLookupValue(PROPERTY_TYPE_LOOKUPS, id);
export const getPropertyTypeDescription = (id: string | number): string => getLookupDescription(PROPERTY_TYPE_LOOKUPS, id);
export const getPropertyTypeBadgeClass = (id: string | number): string => getLookupBadgeClass(PROPERTY_TYPE_LOOKUPS, id);
export const isValidPropertyType = (id: string | number): boolean => isValidLookupId(PROPERTY_TYPE_LOOKUPS, id);

export const getAvailabilityStatusValue = (id: string | number): string => getLookupValue(AVAILABILITY_STATUS_LOOKUPS, id);
export const getAvailabilityStatusDescription = (id: string | number): string => getLookupDescription(AVAILABILITY_STATUS_LOOKUPS, id);
export const getAvailabilityStatusBadgeClass = (id: string | number): string => getLookupBadgeClass(AVAILABILITY_STATUS_LOOKUPS, id);
export const isValidAvailabilityStatus = (id: string | number): boolean => isValidLookupId(AVAILABILITY_STATUS_LOOKUPS, id);

export const getCurrencyValue = (id: string | number): string => getLookupValue(CURRENCY_LOOKUPS, id);
export const getCurrencyDescription = (id: string | number): string => getLookupDescription(CURRENCY_LOOKUPS, id);
export const isValidCurrency = (id: string | number): boolean => isValidLookupId(CURRENCY_LOOKUPS, id);

export const getRentStatusValue = (id: string | number): string => getLookupValue(RENT_STATUS_LOOKUPS, id);
export const getRentStatusDescription = (id: string | number): string => getLookupDescription(RENT_STATUS_LOOKUPS, id);
export const getRentStatusBadgeClass = (id: string | number): string => getLookupBadgeClass(RENT_STATUS_LOOKUPS, id);
export const isValidRentStatus = (id: string | number): boolean => isValidLookupId(RENT_STATUS_LOOKUPS, id);

export const getRoomTypeValue = (id: string | number): string => getLookupValue(ROOM_TYPE_LOOKUPS, id);
export const getRoomTypeDescription = (id: string | number): string => getLookupDescription(ROOM_TYPE_LOOKUPS, id);
export const isValidRoomType = (id: string | number): boolean => isValidLookupId(ROOM_TYPE_LOOKUPS, id);

export const getRoleValue = (id: string | number): string => getLookupValue(ROLES_LOOKUPS, id);
export const getRoleDescription = (id: string | number): string => getLookupDescription(ROLES_LOOKUPS, id);
export const isValidRole = (id: string | number): boolean => isValidLookupId(ROLES_LOOKUPS, id);

export const getCountryValue = (id: string | number): string => getLookupValue(COUNTRY_LOOKUPS, id);
export const getCountryDescription = (id: string | number): string => getLookupDescription(COUNTRY_LOOKUPS, id);
export const isValidCountry = (id: string | number): boolean => isValidLookupId(COUNTRY_LOOKUPS, id);

export const getStateValue = (id: string | number): string => getLookupValue(STATE_LOOKUPS, id);
export const getStateDescription = (id: string | number): string => getLookupDescription(STATE_LOOKUPS, id);
export const isValidState = (id: string | number): boolean => isValidLookupId(STATE_LOOKUPS, id);

// ============================================================================
// CONSTANT VALUES
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1,
    DEFAULT_PAGE_NUMBER: 1
} as const;

export const API_ENDPOINTS = {
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
    ROOMS: {
        BASE: '/rooms',
        SEARCH: '/rooms/search'
    },
    TENANTS: {
        BASE: '/tenants',
        SEARCH: '/tenants/search'
    },
    RENT_TRACKS: {
        BASE: '/rent-tracks',
        SEARCH: '/rent-tracks/search'
    },
    OWNERS: {
        BASE: '/owners',
        SEARCH: '/owners/search'
    },
    LOOKUPS: {
        BASE: '/lookups'
    }
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    PROPERTIES: '/properties',
    PROPERTIES_NEW: '/properties/new',
    ROOMS: '/rooms',
    ROOMS_NEW: '/rooms/new',
    TENANTS: '/tenants',
    TENANTS_NEW: '/tenants/new',
    RENT_TRACKS: '/rent-tracks',
    RENT_TRACKS_NEW: '/rent-tracks/new',
    OWNERS: '/owners',
    OWNERS_NEW: '/owners/new'
} as const;

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================

export * from './enums';
export * from './lookups'; 