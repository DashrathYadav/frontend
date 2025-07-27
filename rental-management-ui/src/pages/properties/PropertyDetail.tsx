import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { propertyApi, roomApi, tenantApi } from '../../services/api';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
    getPropertyTypeValue,
    getAvailabilityStatusValue,
    getCurrencyValue
} from '../../constants/lookups';
import { StatusBadge, TypeBadge } from '../../components/ui/badge-system';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const PropertyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const propertyId = parseInt(id!);

    // Fetch property details
    const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery({
        queryKey: ['property', propertyId],
        queryFn: () => propertyApi.getById(propertyId),
        enabled: !!propertyId,
    });

    // Fetch rooms for this property
    const { data: roomsData } = useQuery({
        queryKey: ['rooms', propertyId],
        queryFn: () => roomApi.getByPropertyId(propertyId, { pageSize: 50 }),
        enabled: !!propertyId,
    });

      // Fetch tenants for this property
  const { data: tenants } = useQuery({
    queryKey: ['tenants', propertyId],
    queryFn: () => tenantApi.getByPropertyId(propertyId),
    enabled: !!propertyId,
  });

  // Fetch property owner contact information
  const { data: ownerContact } = useQuery({
    queryKey: ['property-owner-contact', propertyId],
    queryFn: () => propertyApi.getOwnerContact(propertyId),
    enabled: !!propertyId,
  });

    

    if (propertyLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (propertyError || !property) {
        return <ErrorMessage message="Failed to load property details" />;
    }

    const rooms = roomsData?.data || [];
    const propertyTypeName = getPropertyTypeValue(property.propertyType);
    const statusName = getAvailabilityStatusValue(property.status);
    const currencyName = property.currencyCode ? getCurrencyValue(property.currencyCode) : 'USD';

    const getStatusIcon = (status: number) => {
        switch (status) {
            case 1: // Available
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 2: // Not Available
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 3: // Pending
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 4: // Rented
                return <Users className="w-4 h-4 text-blue-500" />;
            default:
                return <Settings className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{property.propertyName}</h1>
                        <p className="text-gray-600 mt-1">Property ID: #{property.propertyId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/properties/${propertyId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Property
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Property Image and Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Property Image */}
                    <Card>
                        <CardContent className="p-0">
                            {property.propertyPic ? (
                                <img
                                    src={property.propertyPic}
                                    alt={property.propertyName}
                                    className="w-full h-64 object-cover rounded-t-lg"
                                />
                            ) : (
                                <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-lg">
                                    <ImageIcon className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                        </CardContent>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <TypeBadge type={property.propertyType} category="property" />
                                    <StatusBadge status={property.status} category="availability" />
                                </div>
                                <Badge variant="outline" className="text-sm">
                                    {currencyName}
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Monthly Rent</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(property.propertyRent)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Property Value</span>
                                <span className="font-semibold text-lg text-blue-600">
                                    {formatCurrency(property.propertyValue)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Rooms</span>
                                <span className="font-semibold text-lg">{rooms.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Active Tenants</span>
                                <span className="font-semibold text-lg">{tenants?.length || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                              {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {ownerContact?.profilePic ? (
                    <img
                      src={ownerContact.profilePic}
                      alt={ownerContact.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ownerContact?.fullName || property.ownerName}</p>
                  <p className="text-sm text-gray-600">Owner ID: #{property.ownerId}</p>
                  {ownerContact?.mobileNumber && (
                    <p className="text-sm text-gray-600">{ownerContact.mobileNumber}</p>
                  )}
                  {ownerContact?.email && (
                    <p className="text-sm text-gray-600">{ownerContact.email}</p>
                  )}
                </div>
              </div>
              {ownerContact?.note && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <p className="font-medium text-gray-700 mb-1">Note:</p>
                  <p>{ownerContact.note}</p>
                </div>
              )}
              <Link
                to={`/owners/${property.ownerId}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                View Owner Details
                <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
              </Link>
            </CardContent>
          </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="rooms">Rooms</TabsTrigger>
                            <TabsTrigger value="tenants">Tenants</TabsTrigger>
                            <TabsTrigger value="location">Location</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Property Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Property Details</CardTitle>
                                    <CardDescription>Comprehensive information about the property</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Property Name</label>
                                                <p className="text-lg font-semibold text-gray-900">{property.propertyName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Property Type</label>
                                                <p className="text-lg text-gray-900">{propertyTypeName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Property Size</label>
                                                <p className="text-lg text-gray-900">{property.propertySize}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Status</label>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {getStatusIcon(property.status)}
                                                    <span className="text-lg text-gray-900">{statusName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                                                <p className="text-2xl font-bold text-green-600">{formatCurrency(property.propertyRent)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Property Value</label>
                                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(property.propertyValue)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Currency</label>
                                                <p className="text-lg text-gray-900">{currencyName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {property.propertyDescription && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Description</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{property.propertyDescription}</p>
                                        </div>
                                    )}

                                    {/* Facilities */}
                                    {property.propertyFacility && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Facilities</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{property.propertyFacility}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Rooms Tab */}
                        <TabsContent value="rooms" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Rooms</CardTitle>
                                            <CardDescription>All rooms in this property</CardDescription>
                                        </div>
                                        <Link
                                            to={`/rooms/new?propertyId=${propertyId}`}
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                        >
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Add Room
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {rooms.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                                            <p className="text-gray-600 mb-4">This property doesn't have any rooms yet.</p>
                                            <Link
                                                to={`/rooms/new?propertyId=${propertyId}`}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                            >
                                                <Building2 className="w-4 h-4 mr-2" />
                                                Add First Room
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {rooms.map((room) => (
                                                <div
                                                    key={room.roomId}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900">Room #{room.roomNo}</h4>
                                                        <StatusBadge status={room.status} category="availability" />
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Type:</span>
                                                            <span className="font-medium">{room.roomTypeName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Rent:</span>
                                                            <span className="font-medium text-green-600">
                                                                {formatCurrency(room.roomRent)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Tenants:</span>
                                                            <span className="font-medium">
                                                                {room.currentTenantCount}/{room.tenantLimit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t">
                                                        <Link
                                                            to={`/rooms/${room.roomId}`}
                                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                                        >
                                                            View Details →
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tenants Tab */}
                        <TabsContent value="tenants" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tenants</CardTitle>
                                    <CardDescription>Current tenants in this property</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!tenants || tenants.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
                                            <p className="text-gray-600">This property doesn't have any active tenants.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tenants.map((tenant) => (
                                                <div
                                                    key={tenant.tenantId}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                <Users className="w-5 h-5 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{tenant.tenantName}</h4>
                                                                <p className="text-sm text-gray-600">Tenant ID: #{tenant.tenantId}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={tenant.isActive ? "default" : "secondary"}>
                                                            {tenant.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Mobile:</span>
                                                            <span className="ml-2 font-medium">{tenant.tenantMobile}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Email:</span>
                                                            <span className="ml-2 font-medium">{tenant.tenantEmail || "N/A"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Rent:</span>
                                                            <span className="ml-2 font-medium text-green-600">
                                                                {formatCurrency(tenant.presentRentValue || 0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Boarding Date:</span>
                                                            <span className="ml-2 font-medium">
                                                                {new Date(tenant.boardingDate).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t">
                                                        <Link
                                                            to={`/tenants/${tenant.tenantId}`}
                                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                                        >
                                                            View Details →
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Location Tab */}
                        <TabsContent value="location" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Location Details</CardTitle>
                                    <CardDescription>Property address and location information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="flex items-start space-x-3">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-3">Address Components</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Street Address</span>
                                                        <span className="font-medium text-sm">{property.address.street}</span>
                                                    </div>
                                                    {property.address.landMark && (
                                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                            <span className="text-sm text-gray-600">Landmark</span>
                                                            <span className="font-medium text-sm">{property.address.landMark}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Area</span>
                                                        <span className="font-medium text-sm">{property.address.area}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">City</span>
                                                        <span className="font-medium text-sm">{property.address.city}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">State</span>
                                                        <span className="font-medium text-sm">{property.address.state}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-sm text-gray-600">Pincode</span>
                                                        <span className="font-medium text-sm">{property.address.pincode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail; 