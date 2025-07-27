import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import { tenantApi, lookupApi } from '../../services/api';
import { CreateTenantDto } from '../../types';
import { Currency } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';

const schema = yup.object({
  tenantName: yup.string().required('Tenant name is required'),
  tenantMobile: yup.string().required('Mobile number is required').matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
  tenantEmail: yup.string().email('Invalid email format').optional(),
  tenantAdharId: yup.string().required('Aadhar ID is required').matches(/^\d{12}$/, 'Aadhar ID must be 12 digits'),

  // Authentication fields
  loginId: yup.string().required('Login ID is required').min(3, 'Login ID must be at least 3 characters').max(50, 'Login ID must not exceed 50 characters').matches(/^[a-zA-Z0-9_]+$/, 'Login ID can only contain letters, numbers, and underscores'),
  password: yup.string().when('$isEdit', {
    is: true,
    then: (schema) => schema.optional().min(6, 'Password must be at least 6 characters'),
    otherwise: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
  }),

  lockInPeriod: yup.string().required('Lock-in period is required'),
  deposited: yup.number().required('Deposit is required').min(0, 'Deposit cannot be negative'),
  presentRentValue: yup.number().min(0, 'Present rent value cannot be negative').optional(),
  pastRentValue: yup.number().min(0, 'Past rent value cannot be negative').optional(),
  currencyCode: yup.number().optional(),
  boardingDate: yup.string().required('Boarding date is required'),
  ownerId: yup.number().required('Owner is required').min(1),
  propertyId: yup.number().required('Property is required').min(1),
  roomId: yup.number().required('Room is required').min(1),
  permanentAddress: yup.object({
    street: yup.string().required('Street is required'),
    landMark: yup.string().required('Landmark is required'),
    area: yup.string().required('Area is required'),
    city: yup.string().required('City is required'),
    pincode: yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    stateId: yup.number().required('State is required').min(1),
    countryId: yup.number().required('Country is required').min(1),
  }),
  currentAddress: yup.object({
    street: yup.string().required('Street is required'),
    landMark: yup.string().required('Landmark is required'),
    area: yup.string().required('Area is required'),
    city: yup.string().required('City is required'),
    pincode: yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    stateId: yup.number().required('State is required').min(1),
    countryId: yup.number().required('Country is required').min(1),
  }),
});

const TenantForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: lookupApi.getCurrencies,
  });

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: lookupApi.getStates,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: lookupApi.getCountries,
  });

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantApi.getById(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<CreateTenantDto>({
    resolver: yupResolver(schema),
    context: { isEdit },
    defaultValues: {
      currencyCode: 8, // INR = 8
      boardingDate: new Date().toISOString().split('T')[0],
      ownerId: 1, // Default owner
      propertyId: 1, // Default property
      roomId: 1, // Default room
      permanentAddress: {
        countryId: 1,
        stateId: 1,
      },
      currentAddress: {
        countryId: 1,
        stateId: 1,
      }
    }
  });

  const selectedOwnerId = watch('ownerId');

  const { data: properties } = useQuery({
    queryKey: ['properties-lookup', selectedOwnerId],
    queryFn: () => lookupApi.getProperties(selectedOwnerId),
    enabled: Boolean(selectedOwnerId),
  });

  const selectedPropertyId = watch('propertyId');

  const { data: rooms } = useQuery({
    queryKey: ['rooms-lookup', selectedPropertyId],
    queryFn: () => lookupApi.getRoomsByProperty(selectedPropertyId),
    enabled: Boolean(selectedPropertyId),
  });

  // Copy permanent address to current address
  const copyAddress = () => {
    const permanentAddress = watch('permanentAddress');
    setValue('currentAddress', permanentAddress);
  };

  React.useEffect(() => {
    if (isEdit && tenant) {
      reset({
        tenantName: tenant.tenantName,
        tenantMobile: tenant.tenantMobile,
        tenantEmail: tenant.tenantEmail || '',
        tenantAdharId: tenant.tenantAdharId,
        tenantProfilePic: tenant.tenantProfilePic || '',
        tenantDocument: tenant.tenantDocument || '',
        lockInPeriod: tenant.lockInPeriod,
        deposited: tenant.deposited,
        presentRentValue: tenant.presentRentValue || undefined,
        pastRentValue: tenant.pastRentValue || undefined,
        currencyCode: tenant.currencyCode,
        boardingDate: tenant.boardingDate.split('T')[0],
        ownerId: tenant.ownerId,
        propertyId: tenant.propertyId,
        roomId: tenant.roomId || undefined,
        note: tenant.note || '',
        loginId: tenant.loginId,
        password: '', // Password is not returned from backend for security
        permanentAddress: {
          street: tenant.permanentAddress.street,
          landMark: tenant.permanentAddress.landMark,
          area: tenant.permanentAddress.area,
          city: tenant.permanentAddress.city,
          pincode: tenant.permanentAddress.pincode,
          stateId: 1,
          countryId: tenant.permanentAddress.countryId,
        },
        currentAddress: {
          street: tenant.currentAddress.street,
          landMark: tenant.currentAddress.landMark,
          area: tenant.currentAddress.area,
          city: tenant.currentAddress.city,
          pincode: tenant.currentAddress.pincode,
          stateId: 1,
          countryId: tenant.currentAddress.countryId,
        }
      });
    }
  }, [tenant, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate('/tenants');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTenantDto) => tenantApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      navigate('/tenants');
    },
  });

  const onSubmit = (data: CreateTenantDto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/tenants')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Tenant' : 'Add New Tenant'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update tenant information' : 'Register a new tenant'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('tenantName')}
                className="input"
                placeholder="Enter full name"
              />
              {errors.tenantName && (
                <p className="text-error-600 text-sm mt-1">{errors.tenantName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                {...register('tenantMobile')}
                className="input"
                placeholder="Enter 10-digit mobile number"
              />
              {errors.tenantMobile && (
                <p className="text-error-600 text-sm mt-1">{errors.tenantMobile.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                {...register('tenantEmail')}
                className="input"
                placeholder="Enter email address"
              />
              {errors.tenantEmail && (
                <p className="text-error-600 text-sm mt-1">{errors.tenantEmail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar ID *
              </label>
              <input
                {...register('tenantAdharId')}
                className="input"
                placeholder="Enter 12-digit Aadhar number"
              />
              {errors.tenantAdharId && (
                <p className="text-error-600 text-sm mt-1">{errors.tenantAdharId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login ID *
              </label>
              <input
                {...register('loginId')}
                className="input"
                placeholder="Enter login ID (3-50 characters)"
              />
              {errors.loginId && (
                <p className="text-error-600 text-sm mt-1">{errors.loginId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                {...register('password')}
                className="input"
                placeholder={isEdit ? 'Enter new password (optional)' : 'Enter password (min 6 characters)'}
              />
              {errors.password && (
                <p className="text-error-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Assignment */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Assignment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner *
              </label>
              <select {...register('ownerId')} className="input">
                <option value="">Select Owner</option>
                {owners?.data.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.value}
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-error-600 text-sm mt-1">{errors.ownerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <select
                {...register('propertyId')}
                className="input"
                disabled={!selectedOwnerId}
              >
                <option value="">Select Property</option>
                {properties?.data.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.value}
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room *
              </label>
              <select
                {...register('roomId')}
                className="input"
                disabled={!selectedPropertyId}
              >
                <option value="">Select Room</option>
                {rooms?.data.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.value}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="text-error-600 text-sm mt-1">{errors.roomId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boarding Date *
              </label>
              <input
                type="date"
                {...register('boardingDate')}
                className="input"
              />
              {errors.boardingDate && (
                <p className="text-error-600 text-sm mt-1">{errors.boardingDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Deposit *
              </label>
              <input
                type="number"
                {...register('deposited')}
                className="input"
                placeholder="Enter deposit amount"
              />
              {errors.deposited && (
                <p className="text-error-600 text-sm mt-1">{errors.deposited.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Rent
              </label>
              <input
                type="number"
                {...register('presentRentValue')}
                className="input"
                placeholder="Enter current rent amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Rent
              </label>
              <input
                type="number"
                {...register('pastRentValue')}
                className="input"
                placeholder="Enter previous rent amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select {...register('currencyCode')} className="input">
                {currencies?.data.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lock-in Period *
              </label>
              <input
                {...register('lockInPeriod')}
                className="input"
                placeholder="e.g., 12 months"
              />
              {errors.lockInPeriod && (
                <p className="text-error-600 text-sm mt-1">{errors.lockInPeriod.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Permanent Address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('permanentAddress.street')}
                className="input"
                placeholder="Enter street address"
              />
              {errors.permanentAddress?.street && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.street.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark *
              </label>
              <input
                {...register('permanentAddress.landMark')}
                className="input"
                placeholder="Enter landmark"
              />
              {errors.permanentAddress?.landMark && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.landMark.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area *
              </label>
              <input
                {...register('permanentAddress.area')}
                className="input"
                placeholder="Enter area"
              />
              {errors.permanentAddress?.area && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.area.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                {...register('permanentAddress.city')}
                className="input"
                placeholder="Enter city"
              />
              {errors.permanentAddress?.city && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                {...register('permanentAddress.pincode')}
                className="input"
                placeholder="Enter 6-digit pincode"
              />
              {errors.permanentAddress?.pincode && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.pincode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select {...register('permanentAddress.stateId')} className="input">
                <option value="">Select State</option>
                {states?.data.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.value}
                  </option>
                ))}
              </select>
              {errors.permanentAddress?.stateId && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.stateId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select {...register('permanentAddress.countryId')} className="input">
                <option value="">Select Country</option>
                {countries?.data.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.value}
                  </option>
                ))}
              </select>
              {errors.permanentAddress?.countryId && (
                <p className="text-error-600 text-sm mt-1">{errors.permanentAddress.countryId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Current Address */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Current Address</h2>
            <button
              type="button"
              onClick={copyAddress}
              className="btn-secondary text-sm"
            >
              Copy from Permanent Address
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('currentAddress.street')}
                className="input"
                placeholder="Enter street address"
              />
              {errors.currentAddress?.street && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.street.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark *
              </label>
              <input
                {...register('currentAddress.landMark')}
                className="input"
                placeholder="Enter landmark"
              />
              {errors.currentAddress?.landMark && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.landMark.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area *
              </label>
              <input
                {...register('currentAddress.area')}
                className="input"
                placeholder="Enter area"
              />
              {errors.currentAddress?.area && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.area.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                {...register('currentAddress.city')}
                className="input"
                placeholder="Enter city"
              />
              {errors.currentAddress?.city && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                {...register('currentAddress.pincode')}
                className="input"
                placeholder="Enter 6-digit pincode"
              />
              {errors.currentAddress?.pincode && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.pincode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select {...register('currentAddress.stateId')} className="input">
                <option value="">Select State</option>
                {states?.data.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.value}
                  </option>
                ))}
              </select>
              {errors.currentAddress?.stateId && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.stateId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select {...register('currentAddress.countryId')} className="input">
                <option value="">Select Country</option>
                {countries?.data.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.value}
                  </option>
                ))}
              </select>
              {errors.currentAddress?.countryId && (
                <p className="text-error-600 text-sm mt-1">{errors.currentAddress.countryId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('note')}
              rows={4}
              className="input"
              placeholder="Enter any additional notes..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Update Tenant' : 'Create Tenant'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {(createMutation.error || updateMutation.error) && (
        <ErrorMessage
          message={formatErrorMessage(createMutation.error || updateMutation.error)}
        />
      )}
    </div>
  );
};

export default TenantForm;