import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Edit,
    CheckCircle,
    AlertCircle,
    Home,
    User,
    Calendar,
    MapPin,
    DollarSign,
    Trash2,
    Plus
} from 'lucide-react';
import { roomTenantMappingApi, tenantRentSettingApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/ui/badge-system';
import { showSuccess, showError } from '../../utils/toast';
import { formatCurrency } from '../../utils';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const BoardTenantDetail: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const mappingId = parseInt(id!);

    // Fetch mapping details (now includes tenant and room data via joined fields)
    const { data: mapping, isLoading: mappingLoading, error: mappingError } = useQuery({
        queryKey: ['room-tenant-mapping', mappingId],
        queryFn: () => roomTenantMappingApi.getById(mappingId),
        enabled: !!mappingId,
    });

    // Fetch rent settings for this mapping
    const { data: rentSetting, isLoading: rentSettingLoading } = useQuery({
        queryKey: ['rent-setting-by-mapping', mappingId],
        queryFn: () => tenantRentSettingApi.getByMapping(mappingId),
        enabled: !!mappingId,
        retry: false, // Don't retry if not found (404 is expected if no settings exist)
    });

    // Deactivate mapping mutation
    const deactivateMutation = useMutation({
        mutationFn: () => roomTenantMappingApi.deactivate(mappingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room-tenant-mappings'] });
            queryClient.invalidateQueries({ queryKey: ['room-tenant-mapping', mappingId] });
            showSuccess(t('boardTenants.mappingDeactivatedSuccess'));
            navigate('/board-tenants');
        },
        onError: () => {
            showError(t('boardTenants.failedToDeactivate'));
        },
    });

    const handleDeactivate = () => {
        if (window.confirm(t('boardTenants.deactivateConfirmation'))) {
            deactivateMutation.mutate();
        }
    };

    if (mappingLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (mappingError || !mapping) {
        return <ErrorMessage message={t('boardTenants.failedToLoadDetails')} />;
    }

    // Helper function to format dates safely
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return t('boardTenants.notSet');
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return t('boardTenants.invalidDate');
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return t('boardTenants.invalidDate');
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
                        <h1 className="text-3xl font-bold text-gray-900">{t('boardTenants.boardTenantMapping')}</h1>
                        <p className="text-gray-600 mt-1">{t('boardTenants.mappingIdPrefix')}{mapping.roomTenantMappingId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/board-tenants/${mappingId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        {t('boardTenants.editMapping')}
                    </Link>
                    {mapping.isActive && (
                        <button
                            onClick={handleDeactivate}
                            disabled={deactivateMutation.isPending}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('boardTenants.deactivate')}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Status and Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <StatusBadge status={mapping.isActive ? 1 : 0} category="availability" />
                                    <Badge variant={mapping.isActive ? "default" : "secondary"} className="text-sm">
                                        {mapping.isActive ? t('common.active') : t('common.inactive')}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('boardTenants.mappingId')}</span>
                                <span className="font-semibold text-lg">#{mapping.roomTenantMappingId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('common.status')}</span>
                                <span className="font-semibold text-lg">
                                    {mapping.isActive ? t('boardTenants.currentlyOccupied') : t('boardTenants.vacated')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tenant Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                {t('boardTenants.tenantInformation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">{t('boardTenants.name')}</p>
                                <p className="font-semibold text-gray-900">{mapping.tenantName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t('boardTenants.mobile')}</p>
                                <p className="font-medium text-gray-900">{mapping.tenantMobile}</p>
                            </div>
                            {mapping.tenantEmail && (
                                <div>
                                    <p className="text-sm text-gray-600">{t('boardTenants.email')}</p>
                                    <p className="font-medium text-gray-900">{mapping.tenantEmail}</p>
                                </div>
                            )}
                            <Link
                                to={`/tenants/${mapping.tenantId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-2"
                            >
                                {t('boardTenants.viewFullProfile')}
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Room Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Home className="w-5 h-5 mr-2" />
                                {t('boardTenants.roomInformation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">{t('boardTenants.roomNumber')}</p>
                                <p className="font-semibold text-gray-900">#{mapping.roomNo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t('boardTenants.property')}</p>
                                <p className="font-medium text-gray-900">{mapping.propertyName}</p>
                            </div>
                            <Link
                                to={`/rooms/${mapping.roomId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-2"
                            >
                                {t('boardTenants.viewRoomDetails')}
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">{t('boardTenants.overview')}</TabsTrigger>
                            <TabsTrigger value="rent-settings">{t('boardTenants.rentSettings')}</TabsTrigger>
                            <TabsTrigger value="audit">{t('boardTenants.auditTrail')}</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('boardTenants.mappingDetails')}</CardTitle>
                                    <CardDescription>{t('boardTenants.roomTenantOccupancyInfo')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {t('boardTenants.boardingDate')}
                                            </label>
                                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                                {formatDate(mapping.boardingDate)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {t('boardTenants.leavingDate')}
                                            </label>
                                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                                {formatDate(mapping.leavingDate)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('common.status')}</label>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {getStatusIcon(mapping.isActive)}
                                                <span className="text-lg text-gray-900">
                                                    {mapping.isActive ? t('boardTenants.activeOccupied') : t('boardTenants.inactiveVacated')}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {t('boardTenants.mappingId')}
                                            </label>
                                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                                #{mapping.roomTenantMappingId}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Calculate duration */}
                                    {mapping.boardingDate && (
                                        <div className="pt-4 border-t">
                                            <label className="text-sm font-medium text-gray-500">{t('boardTenants.duration')}</label>
                                            <p className="text-lg text-gray-900 mt-1">
                                                {(() => {
                                                    const start = new Date(mapping.boardingDate);
                                                    const end = mapping.leavingDate ? new Date(mapping.leavingDate) : new Date();
                                                    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                    const months = Math.floor(days / 30);
                                                    const remainingDays = days % 30;

                                                    if (months > 0) {
                                                        return `${months} ${months > 1 ? t('boardTenants.months') : t('boardTenants.month')} ${remainingDays > 0 ? `${t('boardTenants.and')} ${remainingDays} ${remainingDays > 1 ? t('boardTenants.days') : t('boardTenants.day')}` : ''}`;
                                                    }
                                                    return `${days} ${days > 1 ? t('boardTenants.days') : t('boardTenants.day')}`;
                                                })()}
                                                {!mapping.leavingDate && ` ${t('boardTenants.ongoing')}`}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Rent Settings Tab */}
                        <TabsContent value="rent-settings" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>{t('boardTenants.rentSettings')}</CardTitle>
                                        <CardDescription>
                                            {t('boardTenants.rentConfigurationInfo')}
                                        </CardDescription>
                                    </div>
                                    {!rentSetting && !rentSettingLoading && (
                                        <Link
                                            to={`/rent-settings/new?mappingId=${mappingId}`}
                                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t('boardTenants.createRentSettings')}
                                        </Link>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {rentSettingLoading ? (
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner size="md" />
                                        </div>
                                    ) : rentSetting ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 flex items-center">
                                                        <DollarSign className="w-4 h-4 mr-2" />
                                                        {t('boardTenants.presentRent')}
                                                    </label>
                                                    <p className="text-lg font-semibold text-green-600 mt-1">
                                                        {formatCurrency(rentSetting.presentRentValue || 0)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">{t('boardTenants.depositedAmount')}</label>
                                                    <p className="text-lg font-semibold text-blue-600 mt-1">
                                                        {formatCurrency(rentSetting.deposited)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">{t('boardTenants.depositToReturn')}</label>
                                                    <p className="text-lg font-semibold text-orange-600 mt-1">
                                                        {formatCurrency(rentSetting.depositToReturn)}
                                                    </p>
                                                </div>

                                                {rentSetting.rentRecurringPeriodInDays && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">{t('boardTenants.rentPeriod')}</label>
                                                        <p className="text-lg text-gray-900 mt-1">
                                                            {t('boardTenants.everyDays')} {rentSetting.rentRecurringPeriodInDays} {rentSetting.rentRecurringPeriodInDays > 1 ? t('boardTenants.days') : t('boardTenants.day')}
                                                        </p>
                                                    </div>
                                                )}

                                                {rentSetting.lockInPeriod && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">{t('boardTenants.lockInPeriod')}</label>
                                                        <p className="text-lg text-gray-900 mt-1">{rentSetting.lockInPeriod}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t flex items-center justify-end space-x-2">
                                                <Link
                                                    to={`/rent-settings/${rentSetting.tenantRentSettingId}`}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    {t('boardTenants.viewFullDetails')}
                                                </Link>
                                                <Link
                                                    to={`/rent-settings/${rentSetting.tenantRentSettingId}/edit`}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    {t('boardTenants.editSettings')}
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('boardTenants.noRentSettings')}</h3>
                                            <p className="text-gray-600 mb-4">
                                                {t('boardTenants.noRentSettingsMessage')}
                                            </p>
                                            <Link
                                                to={`/rent-settings/new?mappingId=${mappingId}`}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {t('boardTenants.createRentSettings')}
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Audit Trail Tab */}
                        <TabsContent value="audit" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('boardTenants.auditTrail')}</CardTitle>
                                    <CardDescription>{t('boardTenants.auditTrailInfo')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('boardTenants.createdBy')}</label>
                                            <p className="text-lg text-gray-900">{t('boardTenants.userIdPrefix')} {mapping.createdBy}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('boardTenants.creationDate')}</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(mapping.creationDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('boardTenants.lastModifiedBy')}</label>
                                            <p className="text-lg text-gray-900">{t('boardTenants.userIdPrefix')} {mapping.lastModifiedBy}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">{t('boardTenants.lastModified')}</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(mapping.lastModificationDate)}
                                            </p>
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

export default BoardTenantDetail;
