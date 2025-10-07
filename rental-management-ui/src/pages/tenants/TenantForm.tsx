import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { tenantApi, lookupApi, ownerApi } from '../../services/api';
import { CreateTenantDto, UpdateTenantDto } from '../../types';
import { useRoleAccess } from '../../hooks';

import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { extractErrorMessage } from '../../utils/errorHandler';
import { formToast } from '../../utils/toast';

const TenantForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  // Validation schema with translations
  const schema = useMemo(() => yup.object({
    tenantName: yup.string().required(t('validation.tenantNameRequired')),
    tenantMobile: yup.string().required(t('validation.tenantMobileRequired')).matches(/^\d{10}$/, t('validation.tenantMobileInvalid')),
    tenantEmail: yup.string().email(t('validation.tenantEmailInvalid')).optional(),
    tenantAdharId: yup.string().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('validation.tenantAadharRequired')).matches(/^\d{12}$/, t('validation.tenantAadharInvalid')),
      otherwise: (schema) => schema.optional(),
    }),

    // Authentication fields (only for create)
    loginId: yup.string().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('validation.tenantLoginIdRequired')).min(3, t('validation.tenantLoginIdMin')).max(50, t('validation.tenantLoginIdMax')).matches(/^[a-zA-Z0-9_]+$/, t('validation.tenantLoginIdInvalid')),
      otherwise: (schema) => schema.optional(),
    }),
    password: yup.string().when('$isEdit', {
      is: true,
      then: (schema) => schema.optional().min(6, t('validation.tenantPasswordMin')),
      otherwise: (schema) => schema.required(t('validation.passwordRequired')).min(6, t('validation.tenantPasswordMin')),
    }),

    // Owner selection (only for create)
    ownerId: yup.number().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('validation.ownerRequired')).min(1, t('validation.ownerSelectRequired')),
      otherwise: (schema) => schema.optional(),
    }),

    lockInPeriod: yup.string().required(t('validation.lockInPeriodRequired')),
    isActive: yup.boolean().when('$isEdit', {
      is: true,
      then: (schema) => schema.required(t('validation.activeStatusRequired')),
      otherwise: (schema) => schema.optional(),
    }),
    permanentAddress: yup.object({
      addressId: yup.number().optional(),
      street: yup.string().required(t('validation.streetRequired')),
      landMark: yup.string().required(t('validation.landmarkRequired')),
      area: yup.string().required(t('validation.areaRequired')),
      city: yup.string().required(t('validation.cityRequired')),
      pincode: yup.string().required(t('validation.pincodeRequired')).matches(/^\d{6}$/, t('validation.pincodeInvalid')),
      stateId: yup.number().required(t('validation.stateRequired')).min(1),
      countryId: yup.number().required(t('validation.countryRequired')).min(1),
    }),
  }), [t]);
  const { isAdmin } = useRoleAccess();

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: lookupApi.getStates,
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: lookupApi.getCountries,
  });

  // Fetch owners list (only for Admin in create mode)
  const { data: owners } = useQuery({
    queryKey: ['owners'],
    queryFn: ownerApi.getAll,
    enabled: !isEdit && isAdmin(),
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
  } = useForm<any>({
    resolver: yupResolver(schema),
    context: { isEdit },
    defaultValues: {
      permanentAddress: {
        countryId: 1,
        stateId: 1,
      }
    }
  });

  React.useEffect(() => {
    if (isEdit && tenant) {
      reset({
        tenantName: tenant.tenantName,
        tenantMobile: tenant.tenantMobile,
        tenantEmail: tenant.tenantEmail || '',
        loginId: tenant.loginId,
        lockInPeriod: tenant.lockInPeriod,
        isActive: tenant.isActive,
        note: tenant.note || '',
        permanentAddress: {
          addressId: tenant.permanentAddress.addressId,
          street: tenant.permanentAddress.street,
          landMark: tenant.permanentAddress.landMark,
          area: tenant.permanentAddress.area,
          city: tenant.permanentAddress.city,
          pincode: tenant.permanentAddress.pincode,
          stateId: tenant.permanentAddress.stateId,
          countryId: tenant.permanentAddress.countryId,
        }
      } as UpdateTenantDto);
    }
  }, [tenant, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      formToast.created('Tenant');
      navigate('/tenants');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTenantDto) => tenantApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      formToast.updated('Tenant');
      navigate('/tenants');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
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
            {isEdit ? t('tenants.editTenant') : t('tenants.addNewTenant')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? t('tenants.updateTenantInfo') : t('tenants.registerNewTenant')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tenants.personalInfo')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.fullName')}
              </label>
              <input
                {...register('tenantName')}
                className="input"
                placeholder={t('tenants.fullNamePlaceholder')}
              />
              {errors.tenantName && (
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantName?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.mobileNumberLabel')}
              </label>
              <input
                {...register('tenantMobile')}
                className="input"
                placeholder={t('tenants.mobileNumberPlaceholder')}
              />
              {errors.tenantMobile && (
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantMobile?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.emailLabel')}
              </label>
              <input
                type="email"
                {...register('tenantEmail')}
                className="input"
                placeholder={t('tenants.emailPlaceholder')}
              />
              {errors.tenantEmail && (
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantEmail?.message || '')}</p>
              )}
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tenants.aadharId')}
                </label>
                <input
                  {...register('tenantAdharId')}
                  className="input"
                  placeholder={t('tenants.aadharIdPlaceholder')}
                />
                {(errors as any).tenantAdharId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).tenantAdharId?.message}</p>
                )}
              </div>
            )}

            {/* Owner Selection - Only for Admin in create mode */}
            {!isEdit && isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tenants.ownerLabel')}
                </label>
                <select {...register('ownerId')} className="input">
                  <option value="">{t('tenants.selectOwner')}</option>
                  {owners?.map((owner) => (
                    <option key={owner.ownerId} value={owner.ownerId}>
                      {owner.fullName} ({owner.mobileNumber})
                    </option>
                  ))}
                </select>
                {(errors as any).ownerId && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).ownerId?.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {t('tenants.ownerHelpText')}
                </p>
              </div>
            )}

            {/* Login ID - Show in edit mode as non-editable */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tenants.loginIdLabel')}
                </label>
                <input
                  {...register('loginId')}
                  className="input bg-gray-100 cursor-not-allowed"
                  placeholder={t('tenants.loginIdLabel')}
                  disabled={true}
                />
                <p className="text-gray-500 text-sm mt-1">
                  {t('tenants.loginIdCannotChange')}
                </p>
              </div>
            )}

            {!isEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tenants.loginIdLabel')} *
                  </label>
                  <input
                    {...register('loginId')}
                    className="input"
                    placeholder={t('tenants.loginIdPlaceholder')}
                  />
                  {(errors as any).loginId && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).loginId?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tenants.passwordLabel')}
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    className="input"
                    placeholder={t('tenants.passwordPlaceholder')}
                  />
                  {(errors as any).password && (
                    <p className="text-error-600 text-sm mt-1">{(errors as any).password?.message}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.lockInPeriodLabel')}
              </label>
              <input
                {...register('lockInPeriod')}
                className="input"
                placeholder={t('tenants.lockInPeriodPlaceholder')}
              />
              {errors.lockInPeriod && (
                <p className="text-error-600 text-sm mt-1">{String(errors.lockInPeriod?.message || '')}</p>
              )}
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tenants.activeStatus')}
                </label>
                <select {...register('isActive')} className="input">
                  <option value="true">{t('common.active')}</option>
                  <option value="false">{t('common.inactive')}</option>
                </select>
                {(errors as any).isActive && (
                  <p className="text-error-600 text-sm mt-1">{(errors as any).isActive?.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Permanent Address */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tenants.permanentAddress')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.streetAddress')}
              </label>
              <input
                {...register('permanentAddress.street')}
                className="input"
                placeholder={t('tenants.streetAddressPlaceholder')}
              />
              {(errors as any).permanentAddress?.street && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.street?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.landmark')}
              </label>
              <input
                {...register('permanentAddress.landMark')}
                className="input"
                placeholder={t('tenants.landmarkPlaceholder')}
              />
              {(errors as any).permanentAddress?.landMark && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.landMark?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.area')}
              </label>
              <input
                {...register('permanentAddress.area')}
                className="input"
                placeholder={t('tenants.areaPlaceholder')}
              />
              {(errors as any).permanentAddress?.area && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.area?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.city')}
              </label>
              <input
                {...register('permanentAddress.city')}
                className="input"
                placeholder={t('tenants.cityPlaceholder')}
              />
              {(errors as any).permanentAddress?.city && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.city?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.pincode')}
              </label>
              <input
                {...register('permanentAddress.pincode')}
                className="input"
                placeholder={t('tenants.pincodePlaceholder')}
              />
              {(errors as any).permanentAddress?.pincode && (
                <p className="text-error-600 text-sm mt-1">{(errors as any).permanentAddress.pincode?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.state')}
              </label>
              <select {...register('permanentAddress.stateId')} className="input">
                <option value="">{t('tenants.selectState')}</option>
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
                {t('tenants.country')}
              </label>
              <select {...register('permanentAddress.countryId')} className="input">
                <option value="">{t('tenants.selectCountry')}</option>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tenants.additionalInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tenants.notes')}
            </label>
            <textarea
              {...register('note')}
              rows={4}
              className="input"
              placeholder={t('tenants.notesPlaceholder')}
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
            {t('common.cancel')}
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
            {isEdit ? t('tenants.updateTenant') : t('tenants.createTenant')}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {(createMutation.error || updateMutation.error) && (
        <ErrorMessage
          error={createMutation.error || updateMutation.error}
        />
      )}
    </div>
  );
};

export default TenantForm;
