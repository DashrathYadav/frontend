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
    User,
    FileText,
    Download,
    Plus,
    MapPin
} from 'lucide-react';
import { tenantApi, roomTenantMappingApi } from '../../services/api';
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

    // Fetch room-tenant mappings for this tenant
    const { data: roomMappings, isLoading: mappingsLoading } = useQuery({
        queryKey: ['room-tenant-mappings', tenantId],
        queryFn: () => roomTenantMappingApi.getByTenant(tenantId),
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
                                <span className="text-sm text-gray-600">Lock-in Period</span>
                                <span className="font-semibold text-lg">{tenant.lockInPeriod}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Room Mappings</span>
                                <span className="font-semibold text-lg text-blue-600">
                                    {roomMappings?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Active Mappings</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {roomMappings?.filter(m => m.isActive).length || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="room-mappings">Room Mappings</TabsTrigger>
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
                                                <label className="text-sm font-medium text-gray-500">Login ID</label>
                                                <p className="text-lg text-gray-900">{tenant.loginId}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Lock-in Period</label>
                                                <p className="text-lg text-gray-900">{tenant.lockInPeriod}</p>
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

                        {/* Room Mappings Tab */}
                        <TabsContent value="room-mappings" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Room Mappings</CardTitle>
                                        <CardDescription>
                                            Rooms currently or previously occupied by this tenant
                                        </CardDescription>
                                    </div>
                                    <Link
                                        to={`/board-tenants/new?tenantId=${tenantId}`}
                                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Board to Room
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {mappingsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner size="md" />
                                        </div>
                                    ) : !roomMappings || roomMappings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No room mappings found</h3>
                                            <p className="text-gray-600 mb-4">This tenant is not currently boarded to any room.</p>
                                            <Link
                                                to={`/board-tenants/new?tenantId=${tenantId}`}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Board to Room
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {roomMappings.map((mapping) => (
                                                <div
                                                    key={mapping.roomTenantMappingId}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900">
                                                            Room ID: {mapping.roomId}
                                                        </h4>
                                                        <Badge variant={mapping.isActive ? "default" : "secondary"}>
                                                            {mapping.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Boarding Date:</span>
                                                            <span className="ml-2 font-medium text-gray-900">
                                                                {formatDate(mapping.boardingDate)}
                                                            </span>
                                                        </div>
                                                        {mapping.leavingDate && (
                                                            <div>
                                                                <span className="text-gray-600">Leaving Date:</span>
                                                                <span className="ml-2 font-medium text-gray-900">
                                                                    {formatDate(mapping.leavingDate)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t flex items-center justify-end space-x-2">
                                                        <Link
                                                            to={`/board-tenants/${mapping.roomTenantMappingId}`}
                                                            className="text-sm text-blue-600 hover:text-blue-700"
                                                        >
                                                            View Details →
                                                        </Link>
                                                        <Link
                                                            to={`/board-tenants/${mapping.roomTenantMappingId}/edit`}
                                                            className="text-sm text-blue-600 hover:text-blue-700"
                                                        >
                                                            Edit →
                                                        </Link>
                                                    </div>
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
