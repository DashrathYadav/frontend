import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import { propertyApi, lookupApi } from '../../services/api';
import { CreatePropertyDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';

const schema = yup.object({
  propertyName: yup.string().required('Property name is required'),
  propertyType: yup.number().required('Property type is required'),
  propertySize: yup.string().required('Property size is required'),
  propertyRent: yup.number().required('Property rent is required').min(0),
  status: yup.number().required('Status is required'),
  propertyDescription: yup.string().required('Description is required'),
  propertyFacility: yup.string().required('Facilities are required'),
  ownerId: yup.number().required('Owner is required').min(1),
  address: yup.object({
    street: yup.string().required('Street is required'),
    landMark: yup.string().required('Landmark is required'),
    area: yup.string().required('Area is required'),
    city: yup.string().required('City is required'),
    pincode: yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    stateId: yup.number().required('State is required').min(1),
    countryId: yup.number().required('Country is required').min(1),
  }),
});

const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: propertyTypes } = useQuery({
    queryKey: ['property-types'],
    queryFn: lookupApi.getPropertyTypes,
  });

  const { data: availabilityStatuses } = useQuery({
    queryKey: ['availability-statuses'],
    queryFn: lookupApi.getAvailabilityStatuses,
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

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getById(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreatePropertyDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      currencyCode: 8, // INR = 8
      status: 1, // Available = 1
      address: {
        countryId: 1,
        stateId: 1,
      }
    }
  });

  React.useEffect(() => {
    if (property && isEdit) {
      reset({
        propertyName: property.propertyName,
        propertyType: property.propertyType,
        propertySize: property.propertySize,
        propertyRent: property.propertyRent,
        currencyCode: property.currencyCode,
        status: property.status as number,
        propertyDescription: property.propertyDescription,
        propertyFacility: property.propertyFacility,
        ownerId: property.ownerId,
        note: property.note || '',
        address: property.address ? {
          street: property.address.street,
          landMark: property.address.landMark,
          area: property.address.area,
          city: property.address.city,
          pincode: property.address.pincode,
          stateId: 1, // Map from address data
          countryId: property.address.countryId,
        } : {
          street: '',
          landMark: '',
          area: '',
          city: '',
          pincode: '',
          stateId: 1,
          countryId: 1,
        }
      });
    }
  }, [property, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: propertyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate('/properties');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreatePropertyDto) => propertyApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      navigate('/properties');
    },
  });

  const onSubmit = (data: CreatePropertyDto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (propertyLoading) {
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
          onClick={() => navigate('/properties')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update property information' : 'Create a new rental property'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Name *
              </label>
              <input
                {...register('propertyName')}
                className="input"
                placeholder="Enter property name"
              />
              {errors.propertyName && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select {...register('propertyType')} className="input">
                <option value="">Select Type</option>
                {propertyTypes?.data.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.value}
                  </option>
                ))}
              </select>
              {errors.propertyType && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Size *
              </label>
              <input
                {...register('propertySize')}
                className="input"
                placeholder="e.g., 1200 sq ft"
              />
              {errors.propertySize && (
                <p className="text-error-600 text-sm mt-1">{errors.propertySize.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                {...register('propertyRent')}
                className="input"
                placeholder="Enter monthly rent"
              />
              {errors.propertyRent && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyRent.message}</p>
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
                Status *
              </label>
              <select {...register('status')} className="input">
                <option value="">Select Status</option>
                {availabilityStatuses?.data.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.value}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-error-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('propertyDescription')}
                rows={3}
                className="input"
                placeholder="Describe the property..."
              />
              {errors.propertyDescription && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyDescription.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facilities *
              </label>
              <textarea
                {...register('propertyFacility')}
                rows={3}
                className="input"
                placeholder="List available facilities..."
              />
              {errors.propertyFacility && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyFacility.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                {...register('address.street')}
                className="input"
                placeholder="Enter street address"
              />
              {errors.address?.street && (
                <p className="text-error-600 text-sm mt-1">{errors.address.street.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark *
              </label>
              <input
                {...register('address.landMark')}
                className="input"
                placeholder="Enter landmark"
              />
              {errors.address?.landMark && (
                <p className="text-error-600 text-sm mt-1">{errors.address.landMark.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area *
              </label>
              <input
                {...register('address.area')}
                className="input"
                placeholder="Enter area"
              />
              {errors.address?.area && (
                <p className="text-error-600 text-sm mt-1">{errors.address.area.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                {...register('address.city')}
                className="input"
                placeholder="Enter city"
              />
              {errors.address?.city && (
                <p className="text-error-600 text-sm mt-1">{errors.address.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                {...register('address.pincode')}
                className="input"
                placeholder="Enter 6-digit pincode"
              />
              {errors.address?.pincode && (
                <p className="text-error-600 text-sm mt-1">{errors.address.pincode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select {...register('address.stateId')} className="input">
                <option value="">Select State</option>
                {states?.data.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.value}
                  </option>
                ))}
              </select>
              {errors.address?.stateId && (
                <p className="text-error-600 text-sm mt-1">{errors.address.stateId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select {...register('address.countryId')} className="input">
                <option value="">Select Country</option>
                {countries?.data.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.value}
                  </option>
                ))}
              </select>
              {errors.address?.countryId && (
                <p className="text-error-600 text-sm mt-1">{errors.address.countryId.message}</p>
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
            onClick={() => navigate('/properties')}
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
            {isEdit ? 'Update Property' : 'Create Property'}
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

export default PropertyForm;