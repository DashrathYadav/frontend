import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi, lookupApi } from '../services/api';
import { extractErrorMessage } from '../utils/errorHandler';
import { showSuccess } from '../utils/toast';
import { useQuery } from '@tanstack/react-query';
import { LanguageSelector } from '../components/LanguageSelector';

// Registration form type matching API requirements
interface RegistrationFormData {
  loginId: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  aadharNumber?: string;
  note?: string;
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

const RegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Validation schema with translations
  const schema = useMemo(() => yup.object({
    loginId: yup.string().required(t('validation.loginIdRequired')).max(50),
    password: yup.string().required(t('validation.passwordRequired')).min(6, t('validation.passwordMin')),
    fullName: yup.string().required(t('validation.fullNameRequired')).max(100),
    mobileNumber: yup.string().required(t('validation.mobileRequired')).matches(/^\d{10,15}$/, t('validation.mobileInvalid')),
    email: yup.string().email(t('validation.emailInvalid')).optional(),
    aadharNumber: yup.string().optional().test('aadhar-format', t('validation.aadharInvalid'), (value) => !value || /^\d{12}$/.test(value)),
    note: yup.string().optional().max(500),
    address: yup.object({
      street: yup.string().required(t('validation.streetRequired')).max(100),
      landMark: yup.string().required(t('validation.landmarkRequired')).max(100),
      area: yup.string().required(t('validation.areaRequired')).max(50),
      city: yup.string().required(t('validation.cityRequired')).max(50),
      pincode: yup.string().required(t('validation.pincodeRequired')).matches(/^\d{6}$/, t('validation.pincodeInvalid')),
      stateId: yup.number().required(t('validation.stateRequired')).min(1),
      countryId: yup.number().required(t('validation.countryRequired')).min(1),
    }),
  }), [t]);

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
        showSuccess(t('auth.registrationSuccess'));
        navigate('/login');
      } else {
        setError('root', { message: data.message || t('auth.registrationFailed') });
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      const apiError = extractErrorMessage(error);
      setError('root', { message: apiError.message });
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
                  <h1 className="text-2xl font-bold text-white">{t('auth.registrationTitle')}</h1>
                  <p className="text-primary-100">{t('auth.registrationTagline')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <Link
                  to="/login"
                  className="text-primary-100 hover:text-white transition-colors duration-200 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">{t('auth.backToLogin')}</span>
                </Link>
              </div>
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
                {t('registration.basicInformation')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.loginId')} *
                  </label>
                  <input
                    type="text"
                    {...register('loginId')}
                    className="input"
                    placeholder={t('auth.loginIdPlaceholder')}
                  />
                  {errors.loginId && (
                    <p className="text-error-600 text-sm mt-1">{errors.loginId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="input pr-10"
                      placeholder={t('auth.passwordPlaceholder')}
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
                    {t('registration.fullName')} *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="input"
                    placeholder={t('registration.fullNamePlaceholder')}
                  />
                  {errors.fullName && (
                    <p className="text-error-600 text-sm mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.mobileNumber')} *
                  </label>
                  <input
                    type="text"
                    {...register('mobileNumber')}
                    className="input"
                    placeholder={t('registration.mobileNumberPlaceholder')}
                    maxLength={15}
                  />
                  {errors.mobileNumber && (
                    <p className="text-error-600 text-sm mt-1">{errors.mobileNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.email')}
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder={t('registration.emailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="text-error-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.aadharNumber')}
                  </label>
                  <input
                    type="text"
                    {...register('aadharNumber')}
                    className="input"
                    placeholder={t('registration.aadharNumberPlaceholder')}
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
                {t('registration.addressInformation')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.street')} *
                  </label>
                  <input
                    type="text"
                    {...register('address.street')}
                    className="input"
                    placeholder={t('registration.streetPlaceholder')}
                  />
                  {errors.address?.street && (
                    <p className="text-error-600 text-sm mt-1">{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.landmark')} *
                  </label>
                  <input
                    type="text"
                    {...register('address.landMark')}
                    className="input"
                    placeholder={t('registration.landmarkPlaceholder')}
                  />
                  {errors.address?.landMark && (
                    <p className="text-error-600 text-sm mt-1">{errors.address.landMark.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.area')} *
                  </label>
                  <input
                    type="text"
                    {...register('address.area')}
                    className="input"
                    placeholder={t('registration.areaPlaceholder')}
                  />
                  {errors.address?.area && (
                    <p className="text-error-600 text-sm mt-1">{errors.address.area.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.city')} *
                  </label>
                  <input
                    type="text"
                    {...register('address.city')}
                    className="input"
                    placeholder={t('registration.cityPlaceholder')}
                  />
                  {errors.address?.city && (
                    <p className="text-error-600 text-sm mt-1">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.pincode')} *
                  </label>
                  <input
                    type="text"
                    {...register('address.pincode')}
                    className="input"
                    placeholder={t('registration.pincodePlaceholder')}
                    maxLength={6}
                  />
                  {errors.address?.pincode && (
                    <p className="text-error-600 text-sm mt-1">{errors.address.pincode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.state')} *
                  </label>
                  <select {...register('address.stateId')} className="input">
                    <option value="">{t('registration.selectState')}</option>
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
                    {t('registration.country')} *
                  </label>
                  <select {...register('address.countryId')} className="input">
                    <option value="">{t('registration.selectCountry')}</option>
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
                {t('registration.note')}
              </label>
              <textarea
                {...register('note')}
                rows={3}
                className="input"
                placeholder={t('registration.notePlaceholder')}
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
                {t('auth.alreadyHaveAccount')} {t('auth.login')}
              </Link>
              <button
                type="submit"
                disabled={registrationMutation.isPending}
                className="btn-primary flex items-center space-x-2"
              >
                {registrationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('auth.registering')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t('auth.registerAsOwner')}</span>
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