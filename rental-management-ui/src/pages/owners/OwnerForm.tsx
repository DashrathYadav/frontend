import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Save } from 'lucide-react';
import { ownerApi, lookupApi } from '../../services/api';
import { CreateOwnerDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const schema = yup.object({
  loginId: yup.string().required('Login ID is required').max(50),
  password: yup.string().required('Password is required').min(6),
  fullName: yup.string().required('Full name is required').max(100),
  mobileNumber: yup.string().required('Mobile number is required').matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
  email: yup.string().email('Invalid email format').optional(),
  aadharNumber: yup.string().matches(/^\d{12}$/, 'Aadhar number must be 12 digits').optional(),
  roleId: yup.string().required('Role is required'),
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

const OwnerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: lookupApi.getStates,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: lookupApi.getCountries,
  });

  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ['owner', id],
    queryFn: () => ownerApi.getById(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateOwnerDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      roleId: '2', // Default to Owner role
      address: {
        countryId: 1, // Default to India
        stateId: 1, // Default to Maharashtra
      }
    }
  });

  React.useEffect(() => {
    if (owner && isEdit) {
      reset({
        loginId: owner.loginId,
        fullName: owner.fullName,
        mobileNumber: owner.mobileNumber,
        email: owner.email || '',
        aadharNumber: owner.aadharNumber || '',
        roleId: owner.roleId.toString(),
        address: {
          street: owner.address.street,
          landMark: owner.address.landMark,
          area: owner.address.area,
          city: owner.address.city,
          pincode: owner.address.pincode,
          stateId: 1, // You'll need to map this from the address
          countryId: owner.address.countryId,
        }
      });
    }
  }, [owner, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: ownerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      navigate('/owners');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateOwnerDto) => ownerApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner', id] });
      navigate('/owners');
    },
  });

  const onSubmit = (data: CreateOwnerDto) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (ownerLoading) {
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
          onClick={() => navigate('/owners')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Owner' : 'Add New Owner'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Update owner information' : 'Create a new property owner account'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login ID *
              </label>
              <input
                {...register('loginId')}
                className="input"
                placeholder="Enter login ID"
              />
              {errors.loginId && (
                <p className="text-error-600 text-sm mt-1">{errors.loginId.message}</p>
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
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-error-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('fullName')}
                className="input"
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="text-error-600 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                {...register('mobileNumber')}
                className="input"
                placeholder="Enter 10-digit mobile number"
              />
              {errors.mobileNumber && (
                <p className="text-error-600 text-sm mt-1">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-error-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                {...register('aadharNumber')}
                className="input"
                placeholder="Enter 12-digit Aadhar number"
              />
              {errors.aadharNumber && (
                <p className="text-error-600 text-sm mt-1">{errors.aadharNumber.message}</p>
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
            onClick={() => navigate('/owners')}
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
            {isEdit ? 'Update Owner' : 'Create Owner'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {(createMutation.error || updateMutation.error) && (
        <ErrorMessage 
          message={createMutation.error?.message || updateMutation.error?.message || 'An error occurred'} 
        />
      )}
    </div>
  );
};

export default OwnerForm;