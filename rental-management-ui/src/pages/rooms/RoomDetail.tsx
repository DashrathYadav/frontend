import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { roomApi, propertyApi, tenantApi } from '../../services/api';
import { formatCurrency } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useLookup } from '../../contexts/LookupContext';
import { StatusBadge, TypeBadge } from '../../components/ui/badge-system';
import { getLatestFile } from '../../services/fileUploadApi';
import { EntityType, FileCategory } from '../../constants/fileUpload';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const RoomDetail: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const roomId = parseInt(id!);
    
    // Use LookupContext for consistent lookup data
    const { 
        getRoomTypeName,
        getAvailabilityStatusName,
        getCurrencyName
    } = useLookup();

    // Fetch room details
    const { data: room, isLoading: roomLoading, error: roomError } = useQuery({
        queryKey: ['room', roomId],
        queryFn: () => roomApi.getById(roomId),
        enabled: !!roomId,
    });

    // Fetch property details for this room
    const { data: property } = useQuery({
        queryKey: ['property', room?.propertyId],
        queryFn: () => propertyApi.getById(room!.propertyId),
        enabled: !!room?.propertyId,
    });

    // Fetch tenants for this room (we'll need to create this API endpoint)
    const { data: tenants } = useQuery({
        queryKey: ['tenants-by-room', roomId],
        queryFn: () => tenantApi.getByRoomId(roomId),
        enabled: !!roomId,
    });

    // Fetch property owner contact information
    const { data: ownerContact } = useQuery({
        queryKey: ['property-owner-contact', room?.propertyId],
        queryFn: () => propertyApi.getOwnerContact(room!.propertyId),
        enabled: !!room?.propertyId,
    });

    // Fetch room image
    const { data: roomImage } = useQuery({
        queryKey: ['room-image', roomId],
        queryFn: () => getLatestFile(EntityType.Room, roomId, FileCategory.RoomImage),
        enabled: !!roomId,
    });

    if (roomLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (roomError || !room) {
        return <ErrorMessage message={t('rooms.errorLoadingDetails')} />;
    }

    const roomTypeName = getRoomTypeName(room.roomTypeId || 0);
    const statusName = getAvailabilityStatusName(room.statusId);
    const currencyName = room.currencyId ? getCurrencyName(room.currencyId) : 'USD';

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
                        <h1 className="text-3xl font-bold text-gray-900">{t('rooms.roomPrefix')}{room.roomNo}</h1>
                        <p className="text-gray-600 mt-1">{t('rooms.roomId')}: #{room.roomId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/rooms/${roomId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        {t('rooms.edit')}
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Room Image and Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Room Image */}
                    <Card>
                        <CardContent className="p-0">
                            {roomImage?.cloudFrontUrl ? (
                                <img
                                    src={roomImage.cloudFrontUrl}
                                    alt={`Room ${room.roomNo}`}
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
                                    <TypeBadge type={room.roomTypeId || 0} category="room" />
                                    <StatusBadge status={room.statusId} category="availability" />
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
                            <CardTitle className="text-lg">{t('rooms.quickStats')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('rooms.monthlyRent')}</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(room.roomRent)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('rooms.tenantLimit')}</span>
                                <span className="font-semibold text-lg">{room.tenantLimit}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('rooms.currentTenants')}</span>
                                <span className="font-semibold text-lg">{room.currentTenantCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('rooms.availability')}</span>
                                <span className="font-semibold text-lg">
                                    {room.currentTenantCount < room.tenantLimit ? t('rooms.available') : t('rooms.full')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rooms.propertyInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{property?.propertyName || room.propertyName}</p>
                                    <p className="text-sm text-gray-600">{t('rooms.propertyIdPrefix')}{room.propertyId}</p>
                                </div>
                            </div>
                            <Link
                                to={`/properties/${room.propertyId}`}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                            >
                                {t('rooms.viewPropertyDetails')}
                                <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Owner Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rooms.propertyOwner')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    {ownerContact?.profilePic ? (
                                        <img
                                            src={ownerContact.profilePic}
                                            alt={ownerContact.fullName}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <Users className="w-5 h-5 text-green-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{ownerContact?.fullName || room.ownerName}</p>
                                    <p className="text-sm text-gray-600">{t('rooms.ownerIdPrefix')}{room.ownerId}</p>
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
                                    <p className="font-medium text-gray-700 mb-1">{t('properties.noteLabel')}</p>
                                    <p>{ownerContact.note}</p>
                                </div>
                            )}
                            <Link
                                to={`/owners/${room.ownerId}`}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                            >
                                {t('rooms.viewOwnerDetails')}
                                <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">{t('properties.overview')}</TabsTrigger>
                            <TabsTrigger value="tenants">{t('tenants.title')}</TabsTrigger>
                            <TabsTrigger value="images">{t('properties.images')}</TabsTrigger>
                            <TabsTrigger value="location">{t('properties.locationDetails')}</TabsTrigger>
                            <TabsTrigger value="details">{t('properties.additionalDetails')}</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Room Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('rooms.roomDetails')}</CardTitle>
                                    <CardDescription>{t('rooms.comprehensiveInfo')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.roomNumberField')}</label>
                                                <p className="text-lg font-semibold text-gray-900">{room.roomNo}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.roomTypeField')}</label>
                                                <p className="text-lg text-gray-900">{roomTypeName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.roomSizeField')}</label>
                                                <p className="text-lg text-gray-900">{room.roomSize || t('rooms.notSpecified')}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('common.status')}</label>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {getStatusIcon(room.statusId)}
                                                    <span className="text-lg text-gray-900">{statusName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.monthlyRent')}</label>
                                                <p className="text-2xl font-bold text-green-600">{formatCurrency(room.roomRent)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.currency')}</label>
                                                <p className="text-lg text-gray-900">{currencyName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.tenantCapacity')}</label>
                                                <p className="text-lg text-gray-900">{room.currentTenantCount}/{room.tenantLimit}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {room.roomDescription && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('properties.description')}</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{room.roomDescription}</p>
                                        </div>
                                    )}

                                    {/* Facilities */}
                                    {room.roomFacility && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('properties.facilities')}</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{room.roomFacility}</p>
                                        </div>
                                    )}

                                    {/* Note */}
                                    {room.note && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('registration.note')}</label>
                                            <p className="mt-2 text-gray-900 leading-relaxed">{room.note}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tenants Tab */}
                        <TabsContent value="tenants" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{t('tenants.title')}</CardTitle>
                                            <CardDescription>{t('rooms.currentTenantsInRoom')}</CardDescription>
                                        </div>
                                        <Link
                                            to={`/tenants?ownerId=${room.ownerId}&propertyId=${room.propertyId}&roomNumber=${room.roomId}`}
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            {t('rooms.viewAllTenants')}
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {!tenants || tenants.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('properties.noTenantsFound')}</h3>
                                            <p className="text-gray-600 mb-4">{t('rooms.noTenantsInRoom')}</p>
                                            <Link
                                                to={`/tenants/new?roomId=${roomId}&propertyId=${room.propertyId}&ownerId=${room.ownerId}`}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                {t('rooms.addTenant')}
                                            </Link>
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
                                                                <p className="text-sm text-gray-600">{t('properties.tenantIdPrefix')}{tenant.tenantId}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={tenant.isActive ? "default" : "secondary"}>
                                                            {tenant.isActive ? t('common.active') : t('common.inactive')}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">{t('properties.mobileLabel')}</span>
                                                            <span className="ml-2 font-medium">{tenant.tenantMobile}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">{t('properties.emailLabel')}</span>
                                                            <span className="ml-2 font-medium">{tenant.tenantEmail || t('properties.notAvailable')}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">{t('properties.aadharIdLabel')}</span>
                                                            <span className="ml-2 font-medium">{tenant.tenantAdharId || t('properties.notAvailable')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t">
                                                        <Link
                                                            to={`/tenants/${tenant.tenantId}`}
                                                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                                        >
                                                            {t('properties.viewDetailsArrow')}
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Images Tab */}
                        <TabsContent value="images" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('rooms.roomImages')}</CardTitle>
                                    <CardDescription>{t('rooms.manageRoomImages')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfilePictureUpload
                                        entityType={EntityType.Room}
                                        entityId={roomId}
                                        entityName={`Room ${room.roomNo}`}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Location Tab */}
                        <TabsContent value="location" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('rooms.locationDetails')}</CardTitle>
                                    <CardDescription>{t('rooms.roomLocationSameAsProperty')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="flex items-start space-x-3">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-3">{t('rooms.propertyAddress')}</h4>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {t('rooms.sameAddressMessage')}
                                                </p>
                                                <Link
                                                    to={`/properties/${room.propertyId}`}
                                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                                >
                                                    {t('rooms.viewPropertyAddressDetails')}
                                                    <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('properties.additionalInfo')}</CardTitle>
                                    <CardDescription>{t('rooms.creationModificationInfo')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('rooms.creationDate')}</label>
                                            <p className="text-lg text-gray-900">
                                                {new Date(room.creationDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {room.lastModificationDate && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">{t('rooms.lastModified')}</label>
                                                <p className="text-lg text-gray-900">
                                                    {new Date(room.lastModificationDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
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

export default RoomDetail; 