import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Edit,
    CheckCircle,
    AlertCircle,
    Clock,
    DollarSign,
    Calendar,
    Building2,
    Home,
    Users,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { rentTrackApi, propertyApi, roomApi, tenantApi, ownerApi } from '../../services/api';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/ui/badge-system';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const RentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rentTrackId = parseInt(id!);

    // Fetch rent track details
    const { data: rentTrack, isLoading: rentTrackLoading, error: rentTrackError } = useQuery({
        queryKey: ['rent-track', rentTrackId],
        queryFn: () => rentTrackApi.getById(rentTrackId),
        enabled: !!rentTrackId,
    });

    // Fetch property details for this rent track
    const { data: property } = useQuery({
        queryKey: ['property', rentTrack?.propertyId],
        queryFn: () => propertyApi.getById(rentTrack!.propertyId),
        enabled: !!rentTrack?.propertyId,
    });

    // Fetch room details for this rent track
    const { data: room } = useQuery({
        queryKey: ['room', rentTrack?.roomId],
        queryFn: () => roomApi.getById(rentTrack!.roomId!),
        enabled: !!rentTrack?.roomId,
    });

    // Fetch tenant details for this rent track
    const { data: tenant } = useQuery({
        queryKey: ['tenant', rentTrack?.tenantId],
        queryFn: () => tenantApi.getById(rentTrack!.tenantId),
        enabled: !!rentTrack?.tenantId,
    });

    // Fetch owner details for this rent track
    const { data: owner } = useQuery({
        queryKey: ['owner', rentTrack?.ownerId],
        queryFn: () => ownerApi.getById(rentTrack!.ownerId),
        enabled: !!rentTrack?.ownerId,
    });

    if (rentTrackLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (rentTrackError || !rentTrack) {
        return <ErrorMessage message="Failed to load rent track details" />;
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

    const getStatusIcon = (status: number) => {
        switch (status) {
            case 1: // Paid
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 2: // Pending
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 3: // Overdue
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1:
                return 'Paid';
            case 2:
                return 'Pending';
            case 3:
                return 'Overdue';
            default:
                return 'Unknown';
        }
    };

    const getStatusVariant = (status: number) => {
        switch (status) {
            case 1:
                return 'default' as const;
            case 2:
                return 'secondary' as const;
            case 3:
                return 'destructive' as const;
            default:
                return 'outline' as const;
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
                        <h1 className="text-3xl font-bold text-gray-900">Rent Payment Details</h1>
                        <p className="text-gray-600 mt-1">Rent Track ID: #{rentTrack.rentTrackId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/rents/${rentTrackId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Rent Record
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Payment Summary and Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Payment Status Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Payment Status</CardTitle>
                                <StatusBadge status={rentTrack.statusId} category="rent" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                {getStatusIcon(rentTrack.statusId)}
                                <span className="font-semibold text-lg">{getStatusLabel(rentTrack.statusId)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Rent Period: {formatDate(rentTrack.rentPeriodStartDate)} - {formatDate(rentTrack.rentPeriodEndDate)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Expected Rent</span>
                                <span className="font-semibold text-lg text-blue-600">
                                    {formatCurrency(rentTrack.expectedRentValue || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Received Amount</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(rentTrack.receivedRentValue || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending Amount</span>
                                <span className="font-semibold text-lg text-red-600">
                                    {formatCurrency(rentTrack.pendingAmount || 0)}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Payment Rate</span>
                                    <span className="font-semibold text-lg">
                                        {rentTrack.expectedRentValue && rentTrack.expectedRentValue > 0
                                            ? Math.round((rentTrack.receivedRentValue || 0) / rentTrack.expectedRentValue * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Entities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Related Entities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                            {tenant && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                                        <p className="text-sm text-gray-600">Tenant ID: #{tenant.tenantId}</p>
                                        <Link
                                            to={`/tenants/${tenant.tenantId}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            View Tenant →
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {owner && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{owner.fullName}</p>
                                        <p className="text-sm text-gray-600">Owner ID: #{owner.ownerId}</p>
                                        <Link
                                            to={`/owners/${owner.ownerId}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            View Owner →
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
                            <TabsTrigger value="payment-details">Payment Details</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Rent Period Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rent Period Information</CardTitle>
                                    <CardDescription>Details about the rent period and payment schedule</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Start Date</label>
                                                <p className="text-lg font-semibold text-gray-900">{formatDate(rentTrack.rentPeriodStartDate)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">End Date</label>
                                                <p className="text-lg font-semibold text-gray-900">{formatDate(rentTrack.rentPeriodEndDate)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Duration</label>
                                                <p className="text-lg text-gray-900">
                                                    {(() => {
                                                        const start = new Date(rentTrack.rentPeriodStartDate);
                                                        const end = new Date(rentTrack.rentPeriodEndDate);
                                                        const diffTime = Math.abs(end.getTime() - start.getTime());
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        return `${diffDays} days`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Status</label>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {getStatusIcon(rentTrack.statusId)}
                                                    <span className="text-lg text-gray-900">{getStatusLabel(rentTrack.statusId)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Currency</label>
                                                <p className="text-lg text-gray-900">
                                                    {rentTrack.currencyId ? `Currency ID: ${rentTrack.currencyId}` : 'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Breakdown</CardTitle>
                                    <CardDescription>Detailed breakdown of expected, received, and pending amounts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Expected Rent</p>
                                                    <p className="text-sm text-gray-600">Amount that should be paid</p>
                                                </div>
                                            </div>
                                            <span className="text-xl font-bold text-blue-600">
                                                {formatCurrency(rentTrack.expectedRentValue || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Received Amount</p>
                                                    <p className="text-sm text-gray-600">Amount already paid</p>
                                                </div>
                                            </div>
                                            <span className="text-xl font-bold text-green-600">
                                                {formatCurrency(rentTrack.receivedRentValue || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Pending Amount</p>
                                                    <p className="text-sm text-gray-600">Amount still due</p>
                                                </div>
                                            </div>
                                            <span className="text-xl font-bold text-red-600">
                                                {formatCurrency(rentTrack.pendingAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Payment Details Tab */}
                        <TabsContent value="payment-details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Analysis</CardTitle>
                                    <CardDescription>Detailed analysis of payment status and trends</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Payment Progress */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Payment Progress</h4>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div
                                                className="bg-green-600 h-4 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${rentTrack.expectedRentValue && rentTrack.expectedRentValue > 0
                                                        ? Math.min((rentTrack.receivedRentValue || 0) / rentTrack.expectedRentValue * 100, 100)
                                                        : 0}%`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    {/* Payment Statistics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {rentTrack.expectedRentValue && rentTrack.expectedRentValue > 0
                                                    ? Math.round((rentTrack.receivedRentValue || 0) / rentTrack.expectedRentValue * 100)
                                                    : 0}%
                                            </div>
                                            <div className="text-sm text-gray-600">Payment Rate</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {rentTrack.receivedRentValue ? 'Yes' : 'No'}
                                            </div>
                                            <div className="text-sm text-gray-600">Payment Made</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {rentTrack.pendingAmount && rentTrack.pendingAmount > 0 ? 'Yes' : 'No'}
                                            </div>
                                            <div className="text-sm text-gray-600">Outstanding</div>
                                        </div>
                                    </div>

                                    {/* Note section if available */}
                                    {rentTrack.note && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Payment Notes</h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-gray-900">{rentTrack.note}</p>
                                            </div>
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
                                                {formatDate(rentTrack.createdDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Last Modified</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(rentTrack.lastModifiedDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Note section if available */}
                                    {rentTrack.note && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Note</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{rentTrack.note}</p>
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

export default RentDetail; 