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
    Building2,
    User,
    FileText,
    Download
} from 'lucide-react';
import { tenantApi, propertyApi, roomApi, rentTrackApi } from '../../services/api';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/ui/badge-system';
import { getLatestFile, getEntityFiles } from '../../services/fileUploadApi';
import { EntityType, FileCategory, DocumentType } from '../../constants/fileUpload';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

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

    // Fetch tenant profile picture
    const { data: profilePicture } = useQuery({
        queryKey: ['tenant-profile-picture', tenantId],
        queryFn: () => getLatestFile(EntityType.Tenant, tenantId, FileCategory.TenantImage),
        enabled: !!tenantId,
    });

    // Fetch tenant documents
    const { data: tenantFiles } = useQuery({
        queryKey: ['tenant-files', tenantId],
        queryFn: () => getEntityFiles(EntityType.Tenant, tenantId, FileCategory.TenantDocument),
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
                            {profilePicture?.cloudFrontUrl ? (
                                <img
                                    src={profilePicture.cloudFrontUrl}
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
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="rent-history">Rent History</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                            <TabsTrigger value="profile-picture">Profile Picture</TabsTrigger>
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
                                    <CardDescription>Permanent address</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Permanent Address</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-600">Street:</span> {tenant.permanentAddress.street}</p>
                                            <p><span className="text-gray-600">Landmark:</span> {tenant.permanentAddress.landMark}</p>
                                            <p><span className="text-gray-600">Area:</span> {tenant.permanentAddress.area}</p>
                                            <p><span className="text-gray-600">City:</span> {tenant.permanentAddress.city}</p>
                                            <p><span className="text-gray-600">State:</span> {tenant.permanentAddress.stateId}</p>
                                            <p><span className="text-gray-600">Pincode:</span> {tenant.permanentAddress.pincode}</p>
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
                                                        <Badge variant={rent.statusId === 1 ? "default" : "secondary"}>
                                                            {rent.statusId === 1 ? "Paid" : "Pending"}
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

                        {/* Documents Tab */}
                        <TabsContent value="documents" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Documents</CardTitle>
                                        <CardDescription>
                                            Uploaded documents for verification
                                        </CardDescription>
                                    </div>
                                    <Link
                                        to={`/tenants/${tenantId}/documents`}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Manage Documents
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {tenantFiles?.files && tenantFiles.files.length > 0 ? (
                                        <div className="space-y-4">
                                            {[
                                                { type: DocumentType.Agreement, label: 'Rental Agreement', icon: FileText },
                                                { type: DocumentType.PermanentAddressProof, label: 'Address Proof', icon: Home },
                                                { type: DocumentType.IdentityProof, label: 'Aadhaar Card', icon: User }
                                            ].map(({ type, label, icon: Icon }) => {
                                                const document = tenantFiles.files.find(f => f.documentType === type);
                                                return (
                                                    <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <Icon className="w-5 h-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                                                {document ? (
                                                                    <div className="flex items-center space-x-4">
                                                                        <p className="text-xs text-gray-500">{document.fileName}</p>
                                                                        <Badge variant="default" className="text-xs">
                                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                                            Uploaded
                                                                        </Badge>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                                        Not uploaded
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {document && (
                                                            <button
                                                                onClick={() => window.open(document.cloudFrontUrl, '_blank')}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Download
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-600">
                                                    Total files: {tenantFiles.totalFileCount} • 
                                                    Total size: {Math.round(tenantFiles.totalFileSize / 1024 / 1024 * 100) / 100} MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">No documents uploaded</h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Upload important documents like rental agreement, address proof, and Aadhaar card.
                                            </p>
                                            <Link
                                                to={`/tenants/${tenantId}/documents`}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Upload Documents
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Profile Picture Tab */}
                        <TabsContent value="profile-picture" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Picture</CardTitle>
                                    <CardDescription>Manage tenant profile picture</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfilePictureUpload
                                        entityType={EntityType.Tenant}
                                        entityId={tenantId}
                                        entityName={tenant?.tenantName}
                                    />
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