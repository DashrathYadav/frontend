import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import { rentTrackApi, lookupApi, tenantApi } from '../../services/api';
import { CreateRentTrackDto } from '../../types';
import { RentStatus, Currency } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';

const schema = yup.object({
  propertyId: yup.number().required('Property is required').min(1),
  tenantId: yup.number().required('Tenant is required').min(1),
  ownerId: yup.number().required('Owner is required').min(1),
  expectedRentValue: yup.number().min(0).optional(),
  receivedRentValue: yup.number().min(0).optional(),
  pendingAmount: yup.number().min(0, 'Pending amount cannot be negative').optional(),
  rentPeriodStartDate: yup.string().required('Start date is required'),
  rentPeriodEndDate: yup.string().required('End date is required'),
  status: yup.number().required('Status is required'),
});

const RentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const hasPreFilledRef = React.useRef(false);

  // Get tenantId from URL params for pre-filling
  const tenantIdFromUrl = searchParams.get('tenantId');

  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: lookupApi.getCurrencies,
  });

  // Fetch tenant data if tenantId is provided in URL
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', tenantIdFromUrl],
    queryFn: () => tenantApi.getById(Number(tenantIdFromUrl)),
    enabled: Boolean(tenantIdFromUrl) && !isEdit,
  });

  const { data: rent, isLoading: rentLoading } = useQuery({
    queryKey: ['rent', id],
    queryFn: () => rentTrackApi.getById(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<CreateRentTrackDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      currencyCode: Currency.INR,
      status: RentStatus.Pending,
      rentPeriodStartDate: new Date().toISOString().split('T')[0],
      rentPeriodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    }
  });

  const selectedOwnerId = watch('ownerId');
  const selectedPropertyId = watch('propertyId');

  // Determine the effective owner and property IDs for queries
  const effectiveOwnerId = selectedOwnerId || tenantData?.ownerId;
  const effectivePropertyId = selectedPropertyId || tenantData?.propertyId;

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-lookup', effectiveOwnerId],
    queryFn: () => lookupApi.getProperties(effectiveOwnerId),
    enabled: Boolean(effectiveOwnerId),
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-lookup', effectivePropertyId],
    queryFn: () => lookupApi.getRoomsByProperty(effectivePropertyId!),
    enabled: Boolean(effectivePropertyId),
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants-lookup', effectiveOwnerId],
    queryFn: () => lookupApi.getTenants(effectiveOwnerId),
    enabled: Boolean(effectiveOwnerId),
  });

  // Check if form is pre-filled from tenant data
  const isPreFilled = Boolean(tenantData && !isEdit);

  // Pre-fill form when tenant data is available
  React.useEffect(() => {
    if (tenantData && !isEdit && !hasPreFilledRef.current) {
      hasPreFilledRef.current = true;

      // Use setValue to ensure immediate form state update
      setValue('propertyId', tenantData.propertyId);
      setValue('roomId', tenantData.roomId);
      setValue('tenantId', tenantData.tenantId);
      setValue('ownerId', tenantData.ownerId);
      setValue('expectedRentValue', tenantData.presentRentValue || 0);
      setValue('receivedRentValue', 0);
      setValue('pendingAmount', 0);
      setValue('rentPeriodStartDate', new Date().toISOString().split('T')[0]);
      setValue('rentPeriodEndDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setValue('status', 1); // Pending = 1
      setValue('note', '');
      setValue('currencyCode', tenantData.currencyCode || 8); // INR = 8
    }
  }, [tenantData, isEdit, setValue]);

  // Reset form for edit mode
  React.useEffect(() => {
    if (rent && isEdit) {
      reset({
        propertyId: rent.propertyId,
        roomId: rent.roomId,
        tenantId: rent.tenantId,
        ownerId: rent.ownerId,
        expectedRentValue: rent.expectedRentValue,
        receivedRentValue: rent.receivedRentValue,
        pendingAmount: rent.pendingAmount,
        rentPeriodStartDate: rent.rentPeriodStartDate.split('T')[0],
        rentPeriodEndDate: rent.rentPeriodEndDate.split('T')[0],
        status: rent.status,
        note: rent.note || '',
        currencyCode: rent.currencyCode,
      });
    }
  }, [rent, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: rentTrackApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      navigate('/rents');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateRentTrackDto) => rentTrackApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['rent', id] });
      navigate('/rents');
    },
  });

  const onSubmit = (data: CreateRentTrackDto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (rentLoading || tenantLoading || propertiesLoading || roomsLoading || tenantsLoading) {
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
          onClick={() => navigate('/rents')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Rent Record' : 'Add New Rent Record'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update rent payment information' : 'Create a new rent tracking record'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Pre-filled indicator */}
        {isPreFilled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Form pre-filled with data from tenant: <strong>{tenantData?.tenantName}</strong>
                  {tenantLoading && <span className="ml-2 text-blue-500">(Loading...)</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Property & Tenant Details</h2>

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
                disabled={!selectedOwnerId || propertiesLoading}
              >
                <option value="">
                  {propertiesLoading ? 'Loading properties...' : 'Select Property'}
                </option>
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
                Room
              </label>
              <select
                {...register('roomId')}
                className="input"
                disabled={!selectedPropertyId || roomsLoading}
              >
                <option value="">
                  {roomsLoading ? 'Loading rooms...' : 'Select Room (Optional)'}
                </option>
                {rooms?.data.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant *
              </label>
              <select
                {...register('tenantId')}
                className="input"
                disabled={!selectedOwnerId || tenantsLoading}
              >
                <option value="">
                  {tenantsLoading ? 'Loading tenants...' : 'Select Tenant'}
                </option>
                {tenants?.data.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.value}
                  </option>
                ))}
              </select>
              {errors.tenantId && (
                <p className="text-error-600 text-sm mt-1">{errors.tenantId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Rent Amount
              </label>
              <input
                type="number"
                {...register('expectedRentValue')}
                className="input"
                placeholder="Enter expected rent amount"
              />
              {errors.expectedRentValue && (
                <p className="text-error-600 text-sm mt-1">{errors.expectedRentValue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received Rent Amount
              </label>
              <input
                type="number"
                {...register('receivedRentValue')}
                className="input"
                placeholder="Enter received rent amount"
              />
              {errors.receivedRentValue && (
                <p className="text-error-600 text-sm mt-1">{errors.receivedRentValue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pending Amount
              </label>
              <input
                type="number"
                {...register('pendingAmount')}
                className="input"
                placeholder="Enter pending amount"
              />
              {errors.pendingAmount && (
                <p className="text-error-600 text-sm mt-1">{errors.pendingAmount.message}</p>
              )}
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
                Payment Status *
              </label>
              <select {...register('status')} className="input">
                <option value="">Select Status</option>
                <option value={1}>Pending</option>
                <option value={2}>Partially Paid</option>
                <option value={3}>Fully Paid</option>
              </select>
              {errors.status && (
                <p className="text-error-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Period Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rent Period</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start Date *
              </label>
              <input
                type="date"
                {...register('rentPeriodStartDate')}
                className="input"
              />
              {errors.rentPeriodStartDate && (
                <p className="text-error-600 text-sm mt-1">{errors.rentPeriodStartDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End Date *
              </label>
              <input
                type="date"
                {...register('rentPeriodEndDate')}
                className="input"
              />
              {errors.rentPeriodEndDate && (
                <p className="text-error-600 text-sm mt-1">{errors.rentPeriodEndDate.message}</p>
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
              placeholder="Enter any additional notes about this rent record..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/rents')}
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
            {isEdit ? 'Update Rent Record' : 'Create Rent Record'}
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

export default RentForm;