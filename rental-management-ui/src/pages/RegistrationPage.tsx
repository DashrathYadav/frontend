import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { authApi, lookupApi } from '../services/api';
import { formatErrorMessage } from '../utils/errorHandler';
import { useQuery } from '@tanstack/react-query';

// Registration form type matching API requirements
interface RegistrationFormData {
  loginId: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  aadharNumber?: string;
  note: string;
  address: {
    street: string;
    landMark: string;
    area: string;
    city: string;
    pincode: string;
    stateId: number;
    countryId: number;
  };
}

const schema = yup.object({
  loginId: yup.string().required('Login ID is required').max(50),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  fullName: yup.string().required('Full name is required').max(100),
  mobileNumber: yup.string().required('Mobile number is required').matches(/^\d{10,15}$/, 'Mobile number must be between 10 and 15 digits'),
  email: yup.string().email('Invalid email format').optional(),
  aadharNumber: yup.string().matches(/^\d{12}$/, 'Aadhar number must be 12 digits').optional(),
  note: yup.string().required('Note is required').max(500),
  address: yup.object({
    street: yup.string().required('Street is required').max(100),
    landMark: yup.string().required('Landmark is required').max(100),
    area: yup.string().required('Area is required').max(50),
    city: yup.string().required('City is required').max(50),
    pincode: yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    stateId: yup.number().required('State is required').min(1),
    countryId: yup.number().required('Country is required').min(1),
  }),
});

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(schema),
  });

  // Fetch lookup data
  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: lookupApi.getStates,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: lookupApi.getCountries,
  });

  const registrationMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.status) {
        // Show success message and redirect to login
        alert('Registration successful! Please login with your credentials.');
        navigate('/login');
      } else {
        setError('root', { message: data.message || 'Registration failed' });
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      const errorMessage = formatErrorMessage(error);
      setError('root', { message: errorMessage });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    // Log the request body before sending
    console.log('Registration form data being sent:', JSON.stringify(data, null, 2));
    
    // Data already matches API requirements, send directly
    registrationMutation.mutate(data as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Owner Registration</h1>
                  <p className="text-primary-100">Join Rentwiz as a Property Owner</p>
                </div>
              </div>
              <Link
                to="/login"
                className="text-primary-100 hover:text-white transition-colors duration-200 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Login</span>
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Error Display */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login ID *
                  </label>
                  <input
                    type="text"
                    {...register('loginId')}
                    className="input"
                    placeholder="Enter unique login ID"
                  />
                  {errors.loginId && (
                    <p className="text-error-600 text-sm mt-1">{errors.loginId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="input pr-10"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-error-600 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
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
                    type="text"
                    {...register('mobileNumber')}
                    className="input"
                    placeholder="Enter 10-15 digit mobile number"
                    maxLength={15}
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
                    type="text"
                    {...register('aadharNumber')}
                    className="input"
                    placeholder="Enter 12-digit Aadhar number"
                    maxLength={12}
                  />
                  {errors.aadharNumber && (
                    <p className="text-error-600 text-sm mt-1">{errors.aadharNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street *
                  </label>
                  <input
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
                    {...register('address.pincode')}
                    className="input"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
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
                    {states?.data?.map(state => (
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
                    {countries?.data?.map(country => (
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

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note *
              </label>
              <textarea
                {...register('note')}
                rows={3}
                className="input"
                placeholder="Enter any additional information about yourself..."
              />
              {errors.note && (
                <p className="text-error-600 text-sm mt-1">{errors.note.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Already have an account? Login
              </Link>
              <button
                type="submit"
                disabled={registrationMutation.isPending}
                className="btn-primary flex items-center space-x-2"
              >
                {registrationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register as Owner</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;