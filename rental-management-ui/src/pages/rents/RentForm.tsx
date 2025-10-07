import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { rentTrackApi, lookupApi, tenantApi } from '../../services/api';
import { CreateRentTrackDto, UpdateRentTrackDto } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatErrorMessage } from '../../utils/errorHandler';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { useLookup } from '../../contexts/LookupContext';

const RentForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const hasPreFilledRef = React.useRef(false);
  const { isAdmin, isOwner, user } = useRoleAccess();
  const { lookups } = useLookup();

  const schema = useMemo(() => yup.object({
    propertyId: yup.number().required(t('rents.propertyRequired')).min(1),
    tenantId: yup.number().required(t('rents.tenantRequired')).min(1),
    ownerId: yup.number().required(t('rents.ownerRequired')).min(1),
    expectedRentValue: yup.number().min(0).optional(),
    receivedRentValue: yup.number().min(0).optional(),
    pendingAmount: yup.number().min(0, t('rents.pendingAmountNegative')).optional(),
    rentPeriodStartDate: yup.string().required(t('rents.startDateRequired')),
    rentPeriodEndDate: yup.string().required(t('rents.endDateRequired')),
    statusId: yup.number().required(t('rents.statusRequired')),
    roomId: yup.number().optional(),
    currencyId: yup.number().optional(),
    note: yup.string().optional(),
  }), [t]);

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
  // Note: Tenant pre-fill is currently disabled as tenant no longer contains room/property/rent info
  // This should be updated to use RoomTenantMapping and TenantRentSetting instead
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', tenantIdFromUrl],
    queryFn: () => tenantApi.getById(Number(tenantIdFromUrl)),
    enabled: false, // Disabled until refactored to use mapping-based pre-fill
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
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      currencyId: Number(lookups.currencies[0]?.id) || undefined,
      statusId: Number(lookups.rentStatuses[0]?.id) || undefined,
      rentPeriodStartDate: new Date().toISOString().split('T')[0],
      rentPeriodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      ownerId: isOwner() ? user?.userId : undefined, // Default to current user if Owner
    }
  });

  const selectedOwnerId = watch('ownerId');
  const selectedPropertyId = watch('propertyId');
  const selectedRoomId = watch('roomId');

  // Determine the effective owner, property, and room IDs for queries
  const effectiveOwnerId = selectedOwnerId;
  const effectivePropertyId = selectedPropertyId;
  const effectiveRoomId = selectedRoomId;

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
    queryKey: ['tenants-by-room', effectiveRoomId],
    queryFn: () => lookupApi.getTenantsByRoom(effectiveRoomId!),
    enabled: Boolean(effectiveRoomId),
  });

  // Check if form is pre-filled from tenant data
  const isPreFilled = Boolean(tenantData && !isEdit);

  // Pre-fill form when tenant data is available
  // DISABLED: Tenant no longer contains room/property/rent info
  // This should be refactored to use RoomTenantMapping and TenantRentSetting
  // React.useEffect(() => {
  //   if (tenantData && !isEdit && !hasPreFilledRef.current) {
  //     hasPreFilledRef.current = true;
  //     // ... pre-fill logic removed
  //   }
  // }, [tenantData, isEdit, setValue]);

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
        statusId: rent.statusId,
        note: rent.note || '',
        currencyId: rent.currencyId,
      });
    }
  }, [rent, isEdit, reset]);

  // Clear tenant selection when room changes
  React.useEffect(() => {
    if (selectedRoomId && !isEdit && !hasPreFilledRef.current) {
      setValue('tenantId', '');
    }
  }, [selectedRoomId, isEdit, setValue]);

  const createMutation = useMutation({
    mutationFn: rentTrackApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      navigate('/rents');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRentTrackDto) => rentTrackApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['rent', id] });
      navigate('/rents');
    },
  });

  const onSubmit = (data: CreateRentTrackDto | UpdateRentTrackDto) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdateRentTrackDto);
    } else {
      createMutation.mutate(data as CreateRentTrackDto);
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
            {isEdit ? t('rents.editRentRecord') : t('rents.addNewRentRecord')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? t('rents.updateRentInfo') : t('rents.createNewRentRecord')}
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
                  {t('rents.formPreFilled')} <strong>{tenantData?.tenantName}</strong>
                  {tenantLoading && <span className="ml-2 text-blue-500">{t('rents.loadingPreFillData')}</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rents.propertyTenantDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner field - visibility and editability based on user role */}
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rents.ownerLabel')}
                </label>
                <select
                  {...register('ownerId')}
                  className="input"
                >
                  <option value="">{t('rents.selectOwner')}</option>
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
                  {t('rents.ownerLabel')}
                </label>
                <select
                  {...register('ownerId')}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled={true}
                >
                  <option value="">{t('rents.selectOwner')}</option>
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
                  {t('rents.onlyCreateForYourself')}
                </p>
              </div>
            )}

            {/* For Owner users in edit mode - hide the field completely */}
            {isEdit && isOwner() && (
              <input type="hidden" {...register('ownerId')} />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.propertyLabel')}
              </label>
              <select
                {...register('propertyId')}
                className={`input ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isEdit || !selectedOwnerId || propertiesLoading}
              >
                <option value="">
                  {propertiesLoading ? t('rents.loadingProperties') : t('rents.selectProperty')}
                </option>
                {properties?.data.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.value}
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="text-error-600 text-sm mt-1">{String(errors.propertyId?.message)}</p>
              )}
              {isEdit && (
                <p className="text-gray-500 text-sm mt-1">
                  {t('rents.propertyCannotChange')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.roomLabel')}
              </label>
              <select
                {...register('roomId')}
                className={`input ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isEdit || !selectedPropertyId || roomsLoading}
              >
                <option value="">
                  {roomsLoading ? t('rents.loadingRooms') : t('rents.selectRoomOptional')}
                </option>
                {rooms?.data.map((room) => (
                  <option key={room.id} value={room.id}>
                    {t('rents.roomLabel')} {room.value}
                  </option>
                ))}
              </select>
              {isEdit && (
                <p className="text-gray-500 text-sm mt-1">
                  {t('rents.roomCannotChange')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.tenantLabel')}
              </label>
              <select
                {...register('tenantId')}
                className={`input ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isEdit || !selectedRoomId || tenantsLoading}
              >
                <option value="">
                  {!selectedRoomId ? t('rents.selectRoomFirst') :
                   tenantsLoading ? t('rents.loadingTenants') :
                   t('rents.selectTenant')}
                </option>
                {tenants?.data.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.value}
                  </option>
                ))}
              </select>
              {errors.tenantId && (
                <p className="text-error-600 text-sm mt-1">{String(errors.tenantId?.message)}</p>
              )}
              {isEdit && (
                <p className="text-gray-500 text-sm mt-1">
                  {t('rents.tenantCannotChange')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rents.financialDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.expectedRentAmount')}
              </label>
              <input
                type="number"
                {...register('expectedRentValue')}
                className="input"
                placeholder={t('rents.expectedRentPlaceholder')}
              />
              {errors.expectedRentValue && (
                <p className="text-error-600 text-sm mt-1">{String(errors.expectedRentValue?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.receivedRentAmount')}
              </label>
              <input
                type="number"
                {...register('receivedRentValue')}
                className="input"
                placeholder={t('rents.receivedRentPlaceholder')}
              />
              {errors.receivedRentValue && (
                <p className="text-error-600 text-sm mt-1">{String(errors.receivedRentValue?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.pendingAmount')}
              </label>
              <input
                type="number"
                {...register('pendingAmount')}
                className="input"
                placeholder={t('rents.pendingAmountPlaceholder')}
              />
              {errors.pendingAmount && (
                <p className="text-error-600 text-sm mt-1">{String(errors.pendingAmount?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.currency')}
              </label>
              <select {...register('currencyId')} className="input">
                {currencies?.data.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.paymentStatus')}
              </label>
              <select {...register('statusId')} className="input">
                <option value="">{t('rents.selectStatus')}</option>
                {lookups.rentStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.value}
                  </option>
                ))}
              </select>
              {errors.statusId && (
                <p className="text-error-600 text-sm mt-1">{String(errors.statusId?.message)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Period Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rents.rentPeriod')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.periodStartDate')}
              </label>
              <input
                type="date"
                {...register('rentPeriodStartDate')}
                className="input"
              />
              {errors.rentPeriodStartDate && (
                <p className="text-error-600 text-sm mt-1">{String(errors.rentPeriodStartDate?.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rents.periodEndDate')}
              </label>
              <input
                type="date"
                {...register('rentPeriodEndDate')}
                className="input"
              />
              {errors.rentPeriodEndDate && (
                <p className="text-error-600 text-sm mt-1">{String(errors.rentPeriodEndDate?.message)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rents.additionalInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('rents.notes')}
            </label>
            <textarea
              {...register('note')}
              rows={4}
              className="input"
              placeholder={t('rents.notesPlaceholder')}
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
            {isEdit ? t('rents.updateRentRecord') : t('rents.createRentRecord')}
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