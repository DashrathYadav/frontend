import {
    PropertyType,
    AvailabilityStatus,
    Currency,
    RentStatus,
    RoomType,
    Country,
    State
} from './enums';

// Lookup data interfaces
export interface LookupData {
    id: string;
    value: string;
    description: string;
}

// Property Type Lookups
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

// Availability Status Lookups
export const AVAILABILITY_STATUS_LOOKUPS: LookupData[] = [
    { id: AvailabilityStatus.Available.toString(), value: 'Available', description: 'Property is available for rent' },
    { id: AvailabilityStatus.NotAvailable.toString(), value: 'Not Available', description: 'Property is not available for rent' },
    { id: AvailabilityStatus.Pending.toString(), value: 'Pending', description: 'Property availability is pending' },
    { id: AvailabilityStatus.Rented.toString(), value: 'Rented', description: 'Property is currently rented' },
    { id: AvailabilityStatus.Sold.toString(), value: 'Sold', description: 'Property has been sold' },
    { id: AvailabilityStatus.UnderMaintenance.toString(), value: 'Under Maintenance', description: 'Property is under maintenance' }
];

// Currency Lookups
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

// Rent Status Lookups
export const RENT_STATUS_LOOKUPS: LookupData[] = [
    { id: RentStatus.Pending.toString(), value: 'Pending', description: 'Rent payment is pending' },
    { id: RentStatus.PartiallyPaid.toString(), value: 'Partially Paid', description: 'Rent has been partially paid' },
    { id: RentStatus.FullyPaid.toString(), value: 'Fully Paid', description: 'Rent has been fully paid' }
];

// Room Type Lookups
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

// Country Lookups
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

// State Lookups (India)
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

// Helper functions
export const getLookupValue = (lookups: LookupData[], id: string | number): string => {
    const lookup = lookups.find(item => item.id === id.toString());
    return lookup?.value || 'Unknown';
};

export const getLookupDescription = (lookups: LookupData[], id: string | number): string => {
    const lookup = lookups.find(item => item.id === id.toString());
    return lookup?.description || '';
};

export const getPropertyTypeValue = (id: string | number): string => getLookupValue(PROPERTY_TYPE_LOOKUPS, id);
export const getAvailabilityStatusValue = (id: string | number): string => getLookupValue(AVAILABILITY_STATUS_LOOKUPS, id);
export const getCurrencyValue = (id: string | number): string => getLookupValue(CURRENCY_LOOKUPS, id);
export const getRentStatusValue = (id: string | number): string => getLookupValue(RENT_STATUS_LOOKUPS, id);
export const getRoomTypeValue = (id: string | number): string => getLookupValue(ROOM_TYPE_LOOKUPS, id);
export const getCountryValue = (id: string | number): string => getLookupValue(COUNTRY_LOOKUPS, id);
export const getStateValue = (id: string | number): string => getLookupValue(STATE_LOOKUPS, id); 