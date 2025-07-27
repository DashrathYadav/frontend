import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Home,
  DollarSign,
  Building2
} from 'lucide-react';
import { tenantApi, propertyApi, roomApi, rentTrackApi } from '../../services/api';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/ui/badge-system';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const TenantDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const tenantId = parseInt(id!);

    // Fetch tenant details
    const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: () => tenantApi.getById(tenantId),
        enabled: !!tenantId,
    });

    // Fetch property details for this tenant
    const { data: property } = useQuery({
        queryKey: ['property', tenant?.propertyId],
        queryFn: () => propertyApi.getById(tenant!.propertyId),
        enabled: !!tenant?.propertyId,
    });

    // Fetch room details for this tenant
    const { data: room } = useQuery({
        queryKey: ['room', tenant?.roomId],
        queryFn: () => roomApi.getById(tenant!.roomId!),
        enabled: !!tenant?.roomId,
    });

    // Fetch rent history for this tenant
    const { data: rentHistory } = useQuery({
        queryKey: ['rent-history', tenantId],
        queryFn: () => rentTrackApi.getByTenantId(tenantId),
        enabled: !!tenantId,
    });

    if (tenantLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (tenantError || !tenant) {
        return <ErrorMessage message="Failed to load tenant details" />;
    }

    // Helper function to format dates safely
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Not available';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const getStatusIcon = (isActive: boolean) => {
        return isActive ?
            <CheckCircle className="w-4 h-4 text-green-500" /> :
            <AlertCircle className="w-4 h-4 text-red-500" />;
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
                        <h1 className="text-3xl font-bold text-gray-900">{tenant.tenantName}</h1>
                        <p className="text-gray-600 mt-1">Tenant ID: #{tenant.tenantId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/tenants/${tenantId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Tenant
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Tenant Image and Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Tenant Image */}
                    <Card>
                        <CardContent className="p-0">
                            {tenant.tenantProfilePic ? (
                                <img
                                    src={tenant.tenantProfilePic}
                                    alt={tenant.tenantName}
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
                                    <StatusBadge status={tenant.isActive ? 1 : 0} category="availability" />
                                    <Badge variant="outline" className="text-sm">
                                        {tenant.roleId === 3 ? 'Tenant' : 'Other'}
                                    </Badge>
                                </div>
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
                                <span className="text-sm text-gray-600">Present Rent</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(tenant.presentRentValue || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Deposited Amount</span>
                                <span className="font-semibold text-lg text-blue-600">
                                    {formatCurrency(tenant.deposited)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Deposit to Return</span>
                                <span className="font-semibold text-lg text-orange-600">
                                    {formatCurrency(tenant.depositToReturn)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Lock-in Period</span>
                                <span className="font-semibold text-lg">{tenant.lockInPeriod}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property & Room Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Property & Room</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {property && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{property.propertyName}</p>
                                        <p className="text-sm text-gray-600">Property ID: #{property.propertyId}</p>
                                        <Link
                                            to={`/properties/${property.propertyId}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            View Property →
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {room && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <Home className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Room #{room.roomNo}</p>
                                        <p className="text-sm text-gray-600">Room ID: #{room.roomId}</p>
                                        <Link
                                            to={`/rooms/${room.roomId}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            View Room →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="rent-history">Rent History</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Tenant Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tenant Details</CardTitle>
                                    <CardDescription>Personal and contact information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Tenant Name</label>
                                                <p className="text-lg font-semibold text-gray-900">{tenant.tenantName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                                                <p className="text-lg text-gray-900">{tenant.tenantMobile}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Email</label>
                                                <p className="text-lg text-gray-900">{tenant.tenantEmail || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Aadhar ID</label>
                                                <p className="text-lg text-gray-900">{tenant.tenantAdharId}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Status</label>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {getStatusIcon(tenant.isActive)}
                                                    <span className="text-lg text-gray-900">
                                                        {tenant.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Boarding Date</label>
                                                <p className="text-lg text-gray-900">{formatDate(tenant.boardingDate)}</p>
                                            </div>
                                            {tenant.leavingDate && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Leaving Date</label>
                                                    <p className="text-lg text-gray-900">{formatDate(tenant.leavingDate)}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Login ID</label>
                                                <p className="text-lg text-gray-900">{tenant.loginId}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note */}
                                    {tenant.note && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Note</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{tenant.note}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Address Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Address Information</CardTitle>
                                    <CardDescription>Current and permanent addresses</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3">Current Address</h4>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="text-gray-600">Street:</span> {tenant.currentAddress.street}</p>
                                                <p><span className="text-gray-600">Landmark:</span> {tenant.currentAddress.landMark}</p>
                                                <p><span className="text-gray-600">Area:</span> {tenant.currentAddress.area}</p>
                                                <p><span className="text-gray-600">City:</span> {tenant.currentAddress.city}</p>
                                                <p><span className="text-gray-600">State:</span> {tenant.currentAddress.state}</p>
                                                <p><span className="text-gray-600">Pincode:</span> {tenant.currentAddress.pincode}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3">Permanent Address</h4>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="text-gray-600">Street:</span> {tenant.permanentAddress.street}</p>
                                                <p><span className="text-gray-600">Landmark:</span> {tenant.permanentAddress.landMark}</p>
                                                <p><span className="text-gray-600">Area:</span> {tenant.permanentAddress.area}</p>
                                                <p><span className="text-gray-600">City:</span> {tenant.permanentAddress.city}</p>
                                                <p><span className="text-gray-600">State:</span> {tenant.permanentAddress.state}</p>
                                                <p><span className="text-gray-600">Pincode:</span> {tenant.permanentAddress.pincode}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Rent History Tab */}
                        <TabsContent value="rent-history" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rent History</CardTitle>
                                    <CardDescription>Payment and rent tracking information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!rentHistory || rentHistory.length === 0 ? (
                                        <div className="text-center py-8">
                                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No rent history found</h3>
                                            <p className="text-gray-600">This tenant doesn't have any rent payment records yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {rentHistory.map((rent) => (
                                                <div
                                                    key={rent.rentTrackId}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900">
                                                            Rent Period: {formatDate(rent.rentPeriodStartDate)} - {formatDate(rent.rentPeriodEndDate)}
                                                        </h4>
                                                        <Badge variant={rent.status === 1 ? "default" : "secondary"}>
                                                            {rent.status === 1 ? "Paid" : "Pending"}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Expected:</span>
                                                            <span className="ml-2 font-medium text-green-600">
                                                                {formatCurrency(rent.expectedRentValue || 0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Received:</span>
                                                            <span className="ml-2 font-medium text-blue-600">
                                                                {formatCurrency(rent.receivedRentValue || 0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Pending:</span>
                                                            <span className="ml-2 font-medium text-red-600">
                                                                {formatCurrency(rent.pendingAmount || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {rent.note && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-medium">Note:</span> {rent.note}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Details</CardTitle>
                                    <CardDescription>Creation and modification information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Creation Date</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(tenant.creationDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Last Modified</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(tenant.lastModificationDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Note section if available */}
                                    {tenant.note && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Note</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{tenant.note}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default TenantDetail; 