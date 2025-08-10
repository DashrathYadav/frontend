import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import { tenantApi, lookupApi } from '../../services/api';
import { CreateTenantDto, UpdateTenantDto } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';
import { useRoleAccess } from '../../hooks/useRoleAccess';

const schema = yup.object({
  tenantName: yup.string().required('Tenant name is required'),
  tenantMobile: yup.string().required('Mobile number is required').matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
  tenantEmail: yup.string().email('Invalid email format').optional(),
  tenantAdharId: yup.string().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Aadhar ID is required').matches(/^\d{12}$/, 'Aadhar ID must be 12 digits'),
    otherwise: (schema) => schema.optional(),
  }),

  // Authentication fields (only for create)
  loginId: yup.string().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Login ID is required').min(3, 'Login ID must be at least 3 characters').max(50, 'Login ID must not exceed 50 characters').matches(/^[a-zA-Z0-9_]+$/, 'Login ID can only contain letters, numbers, and underscores'),
    otherwise: (schema) => schema.optional(),
  }),
  password: yup.string().when('$isEdit', {
    is: true,
    then: (schema) => schema.optional().min(6, 'Password must be at least 6 characters'),
    otherwise: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
  }),

  lockInPeriod: yup.string().required('Lock-in period is required'),
  deposited: yup.number().required('Deposit is required').min(0, 'Deposit cannot be negative'),
  depositToReturn: yup.number().when('$isEdit', {
    is: true,
    then: (schema) => schema.required('Deposit to return is required').min(0, 'Deposit to return cannot be negative'),
    otherwise: (schema) => schema.optional(),
  }),
  presentRentValue: yup.number().min(0, 'Present rent value cannot be negative').optional(),
  pastRentValue: yup.number().min(0, 'Past rent value cannot be negative').optional(),
  currencyCode: yup.number().optional(),
  isActive: yup.boolean().when('$isEdit', {
    is: true,
    then: (schema) => schema.required('Active status is required'),
    otherwise: (schema) => schema.optional(),
  }),
  boardingDate: yup.string().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Boarding date is required'),
    otherwise: (schema) => schema.optional(),
  }),
  leavingDate: yup.string().optional(),
  ownerId: yup.number().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Owner is required').min(1),
    otherwise: (schema) => schema.optional(),
  }),
  propertyId: yup.number().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Property is required').min(1),
    otherwise: (schema) => schema.optional(),
  }),
  roomId: yup.number().when('$isEdit', {
    is: false,
    then: (schema) => schema.required('Room is required').min(1),
    otherwise: (schema) => schema.optional(),
  }),
  permanentAddress: yup.object({
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
  const { isAdmin, isOwner, user } = useRoleAccess();

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
    watch
  } = useForm<any>({
    resolver: yupResolver(schema),
    context: { isEdit },
    defaultValues: {
      currencyCode: 8, // INR = 8
      boardingDate: new Date().toISOString().split('T')[0],
      ownerId: isOwner() ? user?.userId : undefined, // Default to current user if Owner
      permanentAddress: {
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



  React.useEffect(() => {
    if (isEdit && tenant) {
      reset({
        tenantName: tenant.tenantName,
        tenantMobile: tenant.tenantMobile,
        tenantEmail: tenant.tenantEmail || '',
        tenantProfilePic: tenant.tenantProfilePic || '',
        tenantDocument: tenant.tenantDocument || '',
        lockInPeriod: tenant.lockInPeriod,
        deposited: tenant.deposited,
        depositToReturn: tenant.depositToReturn || 0,
        presentRentValue: tenant.presentRentValue || undefined,
        pastRentValue: tenant.pastRentValue || undefined,
        currencyCode: tenant.currencyCode,
        isActive: tenant.isActive,
        boardingDate: tenant.boardingDate.split('T')[0],
        leavingDate: tenant.leavingDate ? tenant.leavingDate.split('T')[0] : '',
        note: tenant.note || '',
        permanentAddress: {
          street: tenant.permanentAddress.street,
          landMark: tenant.permanentAddress.landMark,
          area: tenant.permanentAddress.area,
          city: tenant.permanentAddress.city,
          pincode: tenant.permanentAddress.pincode,
          stateId: 1,
          countryId: tenant.permanentAddress.countryId,
        }
      } as UpdateTenantDto);
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
    mutationFn: (data: UpdateTenantDto) => tenantApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      navigate('/tenants');
    },
  });

  const onSubmit = (data: any) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdateTenantDto);
    } else {
      createMutation.mutate(data as CreateTenantDto);
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
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantName?.message || '')}</p>
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
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantMobile?.message || '')}</p>
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
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantEmail?.message || '')}</p>
              )}
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar ID *
                </label>
                <input
                  {...register('tenantAdharId')}
                  className="input"
                  placeholder="Enter 12-digit Aadhar number"
                />
                {(errors as any).tenantAdharId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).tenantAdharId?.message}</p>
                )}
              </div>
            )}

            {/* Login ID - Show in edit mode as non-editable */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login ID
                </label>
                <input
                  {...register('loginId')}
                  className="input bg-gray-100 cursor-not-allowed"
                  placeholder="Login ID"
                  disabled={true}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Login ID cannot be changed
                </p>
              </div>
            )}

            {!isEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login ID *
                  </label>
                  <input
                    {...register('loginId')}
                    className="input"
                    placeholder="Enter login ID (3-50 characters)"
                  />
                  {(errors as any).loginId && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).loginId?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    className="input"
                    placeholder="Enter password (min 6 characters)"
                  />
                  {(errors as any).password && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).password?.message}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Property Assignment - Only show in create mode */}
        {!isEdit && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Assignment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner field - visibility and editability based on user role */}
              {isAdmin() && (
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
                  {(errors as any).ownerId && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).ownerId?.message}</p>
                  )}
                </div>
              )}

              {/* For Owner users in add mode - show disabled field */}
              {!isEdit && isOwner() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner *
                  </label>
                  <select
                    {...register('ownerId')}
                    className="input bg-gray-100 cursor-not-allowed"
                    disabled={true}
                  >
                    <option value="">Select Owner</option>
                    {owners?.data.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.value}
                      </option>
                    ))}
                  </select>
                  {(errors as any).ownerId && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).ownerId?.message}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    You can only create tenants for yourself
                  </p>
                </div>
              )}

              {/* For Owner users in edit mode - hide the field completely */}
              {isEdit && isOwner() && (
                <input type="hidden" {...register('ownerId')} />
              )}

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
                {(errors as any).propertyId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).propertyId?.message}</p>
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
                {(errors as any).roomId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).roomId?.message}</p>
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
                  <p className="text-error-600 text-sm mt-1">{String(errors.boardingDate?.message || '')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Property Assignment - Show in edit mode */}
        {isEdit && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner field - visibility and editability based on user role */}
              {isAdmin() && (
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
                  {(errors as any).ownerId && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).ownerId?.message}</p>
                  )}
                </div>
              )}

              {/* For Owner users in edit mode - hide the field completely */}
              {isOwner() && (
                <input type="hidden" {...register('ownerId')} />
              )}

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
                {(errors as any).propertyId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).propertyId?.message}</p>
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
                {(errors as any).roomId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).roomId?.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boarding Date *
                </label>
                <input
                  type="date"
                  {...register('boardingDate')}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled={true}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Boarding date cannot be changed in edit mode
                </p>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-error-600 text-sm mt-1">{String(errors.deposited?.message || '')}</p>
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
                <p className="text-error-600 text-sm mt-1">{String(errors.lockInPeriod?.message || '')}</p>
              )}
            </div>

            {isEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit to Return *
                  </label>
                  <input
                    type="number"
                    {...register('depositToReturn')}
                    className="input"
                    placeholder="Enter deposit to return"
                  />
                  {(errors as any).depositToReturn && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).depositToReturn?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leaving Date
                  </label>
                  <input
                    type="date"
                    {...register('leavingDate')}
                    className="input"
                  />
                  {(errors as any).leavingDate && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).leavingDate?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Status *
                  </label>
                  <select {...register('isActive')} className="input">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  {(errors as any).isActive && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).isActive?.message}</p>
                  )}
                </div>
              </>
            )}
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
              {(errors as any).permanentAddress?.street && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.street?.message}</p>
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
              {(errors as any).permanentAddress?.landMark && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.landMark?.message}</p>
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
              {(errors as any).permanentAddress?.area && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.area?.message}</p>
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
              {(errors as any).permanentAddress?.city && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.city?.message}</p>
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
              {(errors as any).permanentAddress?.pincode && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.pincode?.message}</p>
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
              {(errors as any).permanentAddress?.stateId && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.stateId?.message}</p>
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
              {(errors as any).permanentAddress?.countryId && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.countryId?.message}</p>
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