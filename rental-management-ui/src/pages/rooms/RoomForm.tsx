import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { roomApi, lookupApi } from '../../services/api';
import { CreateRoomDto, UpdateRoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { useLookup } from '../../contexts/LookupContext';



const RoomForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { isAdmin, isOwner, user } = useRoleAccess();
  
  // Use LookupContext for consistent lookup data
  const { lookups } = useLookup();

  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });
  
  // Room types, availability statuses, and currencies are now provided by LookupContext



  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomApi.getById(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<any>({
    defaultValues: {
      currencyCode: 8, // INR = 8
      status: 1, // Available = 1
      tenantLimit: 1,
      ownerId: isOwner() ? user?.userId : undefined, // Default to current user if Owner
    }
  });

  const selectedOwnerId = watch('ownerId');

  const { data: properties } = useQuery({
    queryKey: ['properties-lookup', selectedOwnerId],
    queryFn: () => lookupApi.getProperties(selectedOwnerId),
    enabled: Boolean(selectedOwnerId),
  });

  React.useEffect(() => {
    if (room && isEdit) {
      reset({
        roomNo: room.roomNo,
        propertyId: room.propertyId,
        ownerId: room.ownerId,
        roomTypeId: room.roomTypeId,
        roomSize: room.roomSize || '',
        roomRent: room.roomRent,
        currencyId: room.currencyId,
        statusId: room.statusId,
        roomDescription: room.roomDescription || '',
        roomFacility: room.roomFacility || '',
        tenantLimit: room.tenantLimit,
        note: room.note || ''
      });
    }
  }, [room, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: roomApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/rooms');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoomDto) => roomApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      navigate('/rooms');
    },
  });

  const onSubmit = (data: any) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdateRoomDto);
    } else {
      createMutation.mutate(data as CreateRoomDto);
    }
  };

  if (roomLoading) {
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
          onClick={() => navigate('/rooms')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Room' : 'Add New Room'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update room information' : 'Create a new room in your property'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Room Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number *
              </label>
              <input
                type="number"
                {...register('roomNo')}
                className={`input ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter room number"
                disabled={isEdit}
              />
              {errors.roomNo && (
                <p className="text-error-600 text-sm mt-1">{String(errors.roomNo?.message)}</p>
              )}
              {isEdit && (
                <p className="text-gray-500 text-sm mt-1">
                  Room number cannot be changed in edit mode
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select {...register('roomTypeId')} className="input">
                <option value="">Select Type</option>
                {lookups.roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner field - visibility and editability based on user role */}
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner *
                </label>
                <select
                  {...register('ownerId')}
                  className="input"
                >
                  <option value="">Select Owner</option>
                  {owners?.data.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.value}
                    </option>
                  ))}
                </select>
                {errors.ownerId && (
                  <p className="text-error-600 text-sm mt-1">{String(errors.ownerId?.message)}</p>
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
                {errors.ownerId && (
                  <p className="text-error-600 text-sm mt-1">{String(errors.ownerId?.message)}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  You can only create rooms for yourself
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
                className={`input ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isEdit || !selectedOwnerId}
              >
                <option value="">Select Property</option>
                {properties?.data.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.value}
                  </option>
                ))}
              </select>
              {!isEdit && errors.propertyId && (
                <p className="text-error-600 text-sm mt-1">{String(errors.propertyId?.message)}</p>
              )}
              {isEdit && (
                <p className="text-gray-500 text-sm mt-1">
                  Property cannot be changed in edit mode
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Size
              </label>
              <input
                {...register('roomSize')}
                className="input"
                placeholder="e.g., 300 sq ft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                {...register('roomRent')}
                className="input"
                placeholder="Enter monthly rent"
              />
              {errors.roomRent && (
                <p className="text-error-600 text-sm mt-1">{String(errors.roomRent?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select {...register('currencyId')} className="input">
                {lookups.currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select {...register('statusId')} className="input">
                <option value="">Select Status</option>
                {lookups.availabilityStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.value}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-error-600 text-sm mt-1">{String(errors.status?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant Limit *
              </label>
              <input
                type="number"
                {...register('tenantLimit')}
                className="input"
                placeholder="Maximum number of tenants"
              />
              {errors.tenantLimit && (
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantLimit?.message)}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('roomDescription')}
                rows={3}
                className="input"
                placeholder="Describe the room..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facilities
              </label>
              <textarea
                {...register('roomFacility')}
                rows={3}
                className="input"
                placeholder="List available facilities..."
              />
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
            onClick={() => navigate('/rooms')}
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
            {isEdit ? 'Update Room' : 'Create Room'}
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

export default RoomForm;