import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { tenantRentSettingApi, roomTenantMappingApi, lookupApi } from '../../services/api';
import { CreateTenantRentSettingDto, UpdateTenantRentSettingDto } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { extractErrorMessage } from '../../utils/errorHandler';
import { formToast } from '../../utils/toast';

const TenantRentSettingsForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const schema = useMemo(() => yup.object({
    roomTenantMappingId: yup.number().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('rentSettings.mappingRequired')).min(1, t('rentSettings.pleaseSelectMapping')),
      otherwise: (schema) => schema.optional(),
    }),
    deposited: yup.number().required(t('rentSettings.depositedRequired')).min(0, t('rentSettings.depositedMin')),
    depositToReturn: yup.number().required(t('rentSettings.depositToReturnRequired')).min(0, t('rentSettings.depositToReturnMin')),
    presentRentValue: yup.number().optional().min(0, t('rentSettings.presentRentMin')),
    pastRentValue: yup.number().optional().min(0, t('rentSettings.pastRentMin')),
    rentRecurringPeriodInDays: yup.number().optional().min(1, t('rentSettings.rentRecurringMin')),
    rentingCycleStartPeriod: yup.string().optional(),
    lockInPeriod: yup.string().optional(),
    currencyId: yup.number().optional(),
    mobileNo: yup.string().optional(),
    email: yup.string().email(t('common.invalidEmail')).optional(),
  }), [t]);

  // Get pre-filled mapping ID from URL params (for create mode)
  const urlMappingId = searchParams.get('mappingId');

  const [selectedOwnerId] = React.useState<number | undefined>();

  // Fetch currencies for dropdown
  const { data: currencies } = useQuery({
    queryKey: ['currencies-lookup'],
    queryFn: lookupApi.getCurrencies,
  });

  // Fetch all mappings for the dropdown (filtered by owner)
  const { data: mappings } = useQuery({
    queryKey: ['room-tenant-mappings-lookup', selectedOwnerId],
    queryFn: async () => {
      if (!selectedOwnerId) return [];
      return await roomTenantMappingApi.getByOwner(selectedOwnerId);
    },
    enabled: Boolean(selectedOwnerId) && !isEdit,
  });

  // Fetch rent setting for edit mode
  const { data: rentSetting, isLoading: settingLoading } = useQuery({
    queryKey: ['tenant-rent-setting', id],
    queryFn: () => tenantRentSettingApi.getById(Number(id)),
    enabled: isEdit,
  });

  // Fetch mapping details if mappingId is provided in URL
  const { data: selectedMapping } = useQuery({
    queryKey: ['room-tenant-mapping', urlMappingId],
    queryFn: () => roomTenantMappingApi.getById(Number(urlMappingId)),
    enabled: Boolean(urlMappingId) && !isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<any>({
    resolver: yupResolver(schema),
    context: { isEdit },
    defaultValues: {
      roomTenantMappingId: urlMappingId ? Number(urlMappingId) : undefined,
      deposited: 0,
      depositToReturn: 0,
      presentRentValue: 0,
      pastRentValue: 0,
      rentRecurringPeriodInDays: 30,
      currencyId: 1
    }
  });

  // Populate form in edit mode
  React.useEffect(() => {
    if (isEdit && rentSetting) {
      reset({
        tenantRentSettingId: rentSetting.tenantRentSettingId,
        roomTenantMappingId: rentSetting.roomTenantMappingId,
        deposited: rentSetting.deposited,
        depositToReturn: rentSetting.depositToReturn,
        presentRentValue: rentSetting.presentRentValue || 0,
        pastRentValue: rentSetting.pastRentValue || 0,
        rentRecurringPeriodInDays: rentSetting.rentRecurringPeriodInDays || 30,
        rentingCycleStartPeriod: rentSetting.rentingCycleStartPeriod ? rentSetting.rentingCycleStartPeriod.split('T')[0] : '',
        lockInPeriod: rentSetting.lockInPeriod || '',
        currencyId: rentSetting.currencyId || 1,
        mobileNo: rentSetting.mobileNo || '',
        email: rentSetting.email || ''
      });
    }
  }, [rentSetting, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: tenantRentSettingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-rent-settings'] });
      queryClient.invalidateQueries({ queryKey: ['rent-setting-by-mapping'] });
      formToast.created(t('rentSettings.rentSettings'));
      navigate('/rent-settings');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTenantRentSettingDto) => tenantRentSettingApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-rent-settings'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-rent-setting', id] });
      queryClient.invalidateQueries({ queryKey: ['rent-setting-by-mapping'] });
      formToast.updated(t('rentSettings.rentSettings'));
      navigate('/rent-settings');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const onSubmit = (data: any) => {
    const transformedData = {
      ...data,
      rentingCycleStartPeriod: data.rentingCycleStartPeriod === '' ? null : data.rentingCycleStartPeriod,
      lockInPeriod: data.lockInPeriod === '' ? null : data.lockInPeriod,
      mobileNo: data.mobileNo === '' ? null : data.mobileNo,
      email: data.email === '' ? null : data.email,
      presentRentValue: data.presentRentValue === '' ? null : Number(data.presentRentValue),
      pastRentValue: data.pastRentValue === '' ? null : Number(data.pastRentValue),
      rentRecurringPeriodInDays: data.rentRecurringPeriodInDays === '' ? null : Number(data.rentRecurringPeriodInDays),
      currencyId: data.currencyId === '' ? null : Number(data.currencyId),
    };

    if (isEdit) {
      updateMutation.mutate(transformedData as UpdateTenantRentSettingDto);
    } else {
      createMutation.mutate(transformedData as CreateTenantRentSettingDto);
    }
  };

  if (settingLoading) {
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
          onClick={() => navigate('/rent-settings')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? t('rentSettings.editRentSettings') : t('rentSettings.createRentSettings')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? t('rentSettings.updateRentConfig') : t('rentSettings.configureRentDetails')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Mapping Selection - Only in create mode */}
        {!isEdit && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rentSettings.roomTenantMapping')}</h2>

            <div className="grid grid-cols-1 gap-6">
              {selectedMapping ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    {t('rentSettings.selectedMapping')}: #{selectedMapping.roomTenantMappingId}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {t('boardTenants.roomIdPrefix')} {selectedMapping.roomId} | {t('tenants.tenantId')}: {selectedMapping.tenantId}
                  </p>
                  <input type="hidden" {...register('roomTenantMappingId')} value={selectedMapping.roomTenantMappingId} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rentSettings.selectRoomTenantMapping')}
                  </label>
                  <select
                    {...register('roomTenantMappingId')}
                    className="input"
                  >
                    <option value="">{t('rentSettings.selectMapping')}</option>
                    {mappings?.map((mapping) => (
                      <option key={mapping.roomTenantMappingId} value={mapping.roomTenantMappingId}>
                        {t('rentSettings.mappingId')} #{mapping.roomTenantMappingId} - {t('boardTenants.roomLabel')} {mapping.roomId} | {t('tenants.tenant')} {mapping.tenantId}
                      </option>
                    ))}
                  </select>
                  {errors.roomTenantMappingId && (
                    <p className="text-error-600 text-sm mt-1">{String(errors.roomTenantMappingId?.message || '')}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    {t('rentSettings.helpTextSelectMapping')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display mapping in edit mode (read-only) */}
        {isEdit && rentSetting && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rentSettings.mappingInformation')}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.roomTenantMapping')}
              </label>
              <input
                type="text"
                value={`${t('rentSettings.mappingId')}: ${rentSetting.roomTenantMappingId}`}
                className="input bg-gray-100 cursor-not-allowed"
                disabled={true}
              />
              <p className="text-gray-500 text-sm mt-1">
                {t('rentSettings.mappingCannotChange')}
              </p>
            </div>
          </div>
        )}

        {/* Rent Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rentSettings.rentDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.presentRentValue')}
              </label>
              <input
                type="number"
                step="0.01"
                {...register('presentRentValue')}
                className="input"
                placeholder={t('rentSettings.presentRentPlaceholder')}
              />
              {errors.presentRentValue && (
                <p className="text-error-600 text-sm mt-1">{String(errors.presentRentValue?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.pastRentValue')}
              </label>
              <input
                type="number"
                step="0.01"
                {...register('pastRentValue')}
                className="input"
                placeholder={t('rentSettings.pastRentPlaceholder')}
              />
              {errors.pastRentValue && (
                <p className="text-error-600 text-sm mt-1">{String(errors.pastRentValue?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.rentRecurringPeriod')}
              </label>
              <input
                type="number"
                {...register('rentRecurringPeriodInDays')}
                className="input"
                placeholder={t('rentSettings.rentRecurringPlaceholder')}
              />
              {errors.rentRecurringPeriodInDays && (
                <p className="text-error-600 text-sm mt-1">{String(errors.rentRecurringPeriodInDays?.message || '')}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {t('rentSettings.rentRecurringHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.rentCycleStartDate')}
              </label>
              <input
                type="date"
                {...register('rentingCycleStartPeriod')}
                className="input"
              />
              {errors.rentingCycleStartPeriod && (
                <p className="text-error-600 text-sm mt-1">{String(errors.rentingCycleStartPeriod?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.currency')}
              </label>
              <select {...register('currencyId')} className="input">
                <option value="">{t('rentSettings.selectCurrency')}</option>
                {currencies?.data.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.value}
                  </option>
                ))}
              </select>
              {errors.currencyId && (
                <p className="text-error-600 text-sm mt-1">{String(errors.currencyId?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.lockInPeriod')}
              </label>
              <input
                {...register('lockInPeriod')}
                className="input"
                placeholder={t('rentSettings.lockInPlaceholder')}
              />
              {errors.lockInPeriod && (
                <p className="text-error-600 text-sm mt-1">{String(errors.lockInPeriod?.message || '')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Deposit Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rentSettings.depositDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.depositedAmount')}
              </label>
              <input
                type="number"
                step="0.01"
                {...register('deposited')}
                className="input"
                placeholder={t('rentSettings.depositedPlaceholder')}
              />
              {errors.deposited && (
                <p className="text-error-600 text-sm mt-1">{String(errors.deposited?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.depositToReturnLabel')}
              </label>
              <input
                type="number"
                step="0.01"
                {...register('depositToReturn')}
                className="input"
                placeholder={t('rentSettings.depositToReturnPlaceholder')}
              />
              {errors.depositToReturn && (
                <p className="text-error-600 text-sm mt-1">{String(errors.depositToReturn?.message || '')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Override */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rentSettings.contactOverride')}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('rentSettings.contactOverrideHelp')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rentSettings.mobileNumber')}
              </label>
              <input
                {...register('mobileNo')}
                className="input"
                placeholder={t('rentSettings.mobileNumberPlaceholder')}
              />
              {errors.mobileNo && (
                <p className="text-error-600 text-sm mt-1">{String(errors.mobileNo?.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tenants.email')}
              </label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder={t('rentSettings.emailPlaceholder')}
              />
              {errors.email && (
                <p className="text-error-600 text-sm mt-1">{String(errors.email?.message || '')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/rent-settings')}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? t('rentSettings.updateSettings') : t('rentSettings.createSettings')}
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

export default TenantRentSettingsForm;
