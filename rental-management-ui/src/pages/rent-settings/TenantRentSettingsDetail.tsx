import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Edit,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Calendar,
    MapPin,
    Trash2,
    Home,
    User
} from 'lucide-react';
import { tenantRentSettingApi, roomTenantMappingApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { showSuccess, showError } from '../../utils/toast';
import { formatCurrency } from '../../utils';

// Import shadcn-ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const TenantRentSettingsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const settingId = parseInt(id!);

    // Fetch rent setting details
    const { data: rentSetting, isLoading: settingLoading, error: settingError } = useQuery({
        queryKey: ['tenant-rent-setting', settingId],
        queryFn: () => tenantRentSettingApi.getById(settingId),
        enabled: !!settingId,
    });

    // Fetch related mapping (for mapping details tab - boarding/leaving dates)
    const { data: mapping, isLoading: mappingLoading } = useQuery({
        queryKey: ['room-tenant-mapping', rentSetting?.roomTenantMappingId],
        queryFn: () => roomTenantMappingApi.getById(rentSetting!.roomTenantMappingId),
        enabled: !!rentSetting?.roomTenantMappingId,
    });

    // Delete rent setting mutation
    const deleteMutation = useMutation({
        mutationFn: () => tenantRentSettingApi.delete(settingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-rent-settings'] });
            queryClient.invalidateQueries({ queryKey: ['rent-setting-by-mapping'] });
            showSuccess('Rent settings deleted successfully');
            navigate('/rent-settings');
        },
        onError: () => {
            showError('Failed to delete rent settings');
        },
    });

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete these rent settings? This action cannot be undone.')) {
            deleteMutation.mutate();
        }
    };

    if (settingLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (settingError || !rentSetting) {
        return <ErrorMessage message="Failed to load rent settings" />;
    }

    // Helper function to format dates safely
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Not set';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
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
                        <h1 className="text-3xl font-bold text-gray-900">Rent Settings</h1>
                        <p className="text-gray-600 mt-1">Settings ID: #{rentSetting.tenantRentSettingId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/rent-settings/${settingId}/edit`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Settings
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Quick Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Rent Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rent Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Present Rent</span>
                                <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(rentSetting.presentRentValue || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Deposited</span>
                                <span className="font-semibold text-lg text-blue-600">
                                    {formatCurrency(rentSetting.deposited)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">To Return</span>
                                <span className="font-semibold text-lg text-orange-600">
                                    {formatCurrency(rentSetting.depositToReturn)}
                                </span>
                            </div>
                            {rentSetting.rentRecurringPeriodInDays && (
                                <div className="pt-3 border-t">
                                    <span className="text-sm text-gray-600">Rent Cycle</span>
                                    <p className="font-medium text-gray-900 mt-1">
                                        Every {rentSetting.rentRecurringPeriodInDays} day{rentSetting.rentRecurringPeriodInDays > 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tenant Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Tenant
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold text-gray-900">{rentSetting.tenantName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Mobile</p>
                                <p className="font-medium text-gray-900">{rentSetting.tenantMobile}</p>
                            </div>
                            {rentSetting.tenantEmail && (
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium text-gray-900">{rentSetting.tenantEmail}</p>
                                </div>
                            )}
                            <Link
                                to={`/tenants/${rentSetting.tenantId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-2"
                            >
                                View Profile →
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Room Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Home className="w-5 h-5 mr-2" />
                                Room & Property
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Room Number</p>
                                <p className="font-semibold text-gray-900">#{rentSetting.roomNo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Property</p>
                                <p className="font-medium text-gray-900">{rentSetting.propertyName}</p>
                            </div>
                            <Link
                                to={`/rooms/${rentSetting.roomId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-2"
                            >
                                View Room →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="mapping">Mapping Details</TabsTrigger>
                            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Rent Configuration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rent Configuration</CardTitle>
                                    <CardDescription>Payment and rent cycle details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Present Rent Value
                                            </label>
                                            <p className="text-lg font-semibold text-green-600 mt-1">
                                                {formatCurrency(rentSetting.presentRentValue || 0)}
                                            </p>
                                        </div>

                                        {rentSetting.pastRentValue && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Past Rent Value</label>
                                                <p className="text-lg font-semibold text-gray-600 mt-1">
                                                    {formatCurrency(rentSetting.pastRentValue)}
                                                </p>
                                            </div>
                                        )}

                                        {rentSetting.rentRecurringPeriodInDays && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Rent Recurring Period</label>
                                                <p className="text-lg text-gray-900 mt-1">
                                                    Every {rentSetting.rentRecurringPeriodInDays} day{rentSetting.rentRecurringPeriodInDays > 1 ? 's' : ''}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {rentSetting.rentRecurringPeriodInDays === 1 && '(Daily)'}
                                                    {rentSetting.rentRecurringPeriodInDays === 7 && '(Weekly)'}
                                                    {rentSetting.rentRecurringPeriodInDays === 30 && '(Monthly)'}
                                                    {rentSetting.rentRecurringPeriodInDays === 365 && '(Yearly)'}
                                                </p>
                                            </div>
                                        )}

                                        {rentSetting.rentingCycleStartPeriod && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Rent Cycle Start Date
                                                </label>
                                                <p className="text-lg text-gray-900 mt-1">
                                                    {formatDate(rentSetting.rentingCycleStartPeriod)}
                                                </p>
                                            </div>
                                        )}

                                        {rentSetting.lockInPeriod && (
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-medium text-gray-500">Lock-in Period</label>
                                                <p className="text-lg text-gray-900 mt-1">{rentSetting.lockInPeriod}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deposit Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Deposit Information</CardTitle>
                                    <CardDescription>Security deposit details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Deposited Amount</label>
                                            <p className="text-lg font-semibold text-blue-600 mt-1">
                                                {formatCurrency(rentSetting.deposited)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Deposit to Return</label>
                                            <p className="text-lg font-semibold text-orange-600 mt-1">
                                                {formatCurrency(rentSetting.depositToReturn)}
                                            </p>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-500">Deductions/Adjustments</label>
                                            <p className="text-lg font-semibold text-red-600 mt-1">
                                                {formatCurrency(rentSetting.deposited - rentSetting.depositToReturn)}
                                            </p>
                                            {rentSetting.deposited !== rentSetting.depositToReturn && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Difference between deposited and returnable amount
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Override */}
                            {(rentSetting.mobileNo || rentSetting.email) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contact Override</CardTitle>
                                        <CardDescription>Alternative contact for rent notifications</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {rentSetting.mobileNo && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                                                <p className="text-lg text-gray-900 mt-1">{rentSetting.mobileNo}</p>
                                            </div>
                                        )}
                                        {rentSetting.email && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Email</label>
                                                <p className="text-lg text-gray-900 mt-1">{rentSetting.email}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Mapping Details Tab */}
                        <TabsContent value="mapping" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Room-Tenant Mapping</CardTitle>
                                        <CardDescription>
                                            Related occupancy information
                                        </CardDescription>
                                    </div>
                                    {mapping && (
                                        <Link
                                            to={`/board-tenants/${mapping.roomTenantMappingId}`}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            View Full Details →
                                        </Link>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {mappingLoading ? (
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner size="md" />
                                        </div>
                                    ) : mapping ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 flex items-center">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        Mapping ID
                                                    </label>
                                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                                        #{mapping.roomTenantMappingId}
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {mapping.isActive ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        )}
                                                        <Badge variant={mapping.isActive ? "default" : "secondary"}>
                                                            {mapping.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Boarding Date
                                                    </label>
                                                    <p className="text-lg text-gray-900 mt-1">
                                                        {formatDate(mapping.boardingDate)}
                                                    </p>
                                                </div>

                                                {mapping.leavingDate && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Leaving Date</label>
                                                        <p className="text-lg text-gray-900 mt-1">
                                                            {formatDate(mapping.leavingDate)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-sm text-gray-500">Mapping information unavailable</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Audit Trail Tab */}
                        <TabsContent value="audit" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Audit Trail</CardTitle>
                                    <CardDescription>Creation and modification history</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Created By</label>
                                            <p className="text-lg text-gray-900">User ID: {rentSetting.createdBy}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Creation Date</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(rentSetting.creationDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Last Modified By</label>
                                            <p className="text-lg text-gray-900">User ID: {rentSetting.lastModifiedBy}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Last Modified</label>
                                            <p className="text-lg text-gray-900">
                                                {formatDate(rentSetting.lastModificationDate)}
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

export default TenantRentSettingsDetail;
