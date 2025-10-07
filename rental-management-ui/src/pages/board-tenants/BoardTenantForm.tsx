import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { roomTenantMappingApi, lookupApi } from '../../services/api';
import { CreateRoomTenantMappingDto, UpdateRoomTenantMappingDto } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { extractErrorMessage } from '../../utils/errorHandler';
import { formToast, showError } from '../../utils/toast';
import { useRoleAccess } from '../../hooks/useRoleAccess';

const BoardTenantForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { isAdmin, isOwner, user } = useRoleAccess();

  const schema = useMemo(() => yup.object({
    tenantId: yup.number().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('boardTenants.tenantRequired')).min(1, t('boardTenants.pleaseSelectTenant')),
      otherwise: (schema) => schema.optional(),
    }),
    roomId: yup.number().when('$isEdit', {
      is: false,
      then: (schema) => schema.required(t('boardTenants.roomRequired')).min(1, t('boardTenants.pleaseSelectRoom')),
      otherwise: (schema) => schema.optional(),
    }),
    boardingDate: yup.string().required(t('boardTenants.boardingDateRequired')),
    leavingDate: yup.string().optional().test(
      'is-after-boarding',
      t('boardTenants.leavingDateMustBeAfter'),
      function(value) {
        const { boardingDate } = this.parent;
        if (!value || !boardingDate) return true;
        return new Date(value) > new Date(boardingDate);
      }
    ),
    isActive: yup.boolean().when('$isEdit', {
      is: true,
      then: (schema) => schema.required(t('boardTenants.activeStatusRequired')),
      otherwise: (schema) => schema.optional(),
    }),
  }), [t]);

  // Get pre-filled values from URL params (for create mode)
  const urlTenantId = searchParams.get('tenantId');
  const urlRoomId = searchParams.get('roomId');

  const [selectedOwnerId, setSelectedOwnerId] = React.useState<number | undefined>();
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<number | undefined>();
  const [duplicateCheckResult, setDuplicateCheckResult] = React.useState<{ checked: boolean; exists: boolean }>({
    checked: false,
    exists: false
  });

  // Fetch lookups
  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: properties } = useQuery({
    queryKey: ['properties-lookup', selectedOwnerId],
    queryFn: () => lookupApi.getProperties(selectedOwnerId),
    enabled: Boolean(selectedOwnerId),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-lookup', selectedPropertyId],
    queryFn: () => lookupApi.getRoomsByProperty(selectedPropertyId!),
    enabled: Boolean(selectedPropertyId),
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants-lookup', selectedOwnerId],
    queryFn: () => lookupApi.getTenants(selectedOwnerId),
    enabled: Boolean(selectedOwnerId),
  });

  // Fetch mapping for edit mode
  const { data: mapping, isLoading: mappingLoading } = useQuery({
    queryKey: ['room-tenant-mapping', id],
    queryFn: () => roomTenantMappingApi.getById(Number(id)),
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
    context: { isEdit },
    defaultValues: {
      boardingDate: new Date().toISOString().split('T')[0],
      tenantId: urlTenantId ? Number(urlTenantId) : undefined,
      roomId: urlRoomId ? Number(urlRoomId) : undefined,
      isActive: true
    }
  });

  const watchedTenantId = watch('tenantId');
  const watchedRoomId = watch('roomId');

  // Set default owner for Owner role
  React.useEffect(() => {
    if (isOwner() && user?.userId && !selectedOwnerId) {
      setSelectedOwnerId(user.userId);
    } else if (isAdmin() && owners?.data?.length === 1) {
      setSelectedOwnerId(Number(owners.data[0].id));
    }
  }, [isOwner, user, owners, selectedOwnerId]);

  // Populate form in edit mode
  React.useEffect(() => {
    if (isEdit && mapping) {
      reset({
        tenantId: mapping.tenantId,
        roomId: mapping.roomId,
        boardingDate: mapping.boardingDate.split('T')[0],
        leavingDate: mapping.leavingDate ? mapping.leavingDate.split('T')[0] : '',
        isActive: mapping.isActive,
        roomTenantMappingId: mapping.roomTenantMappingId
      });
    }
  }, [mapping, isEdit, reset]);

  // Check for duplicate active mapping
  const checkDuplicateMutation = useMutation({
    mutationFn: ({ roomId, tenantId }: { roomId: number; tenantId: number }) =>
      roomTenantMappingApi.checkActiveMapping(roomId, tenantId),
    onSuccess: (exists) => {
      setDuplicateCheckResult({ checked: true, exists });
    },
  });

  React.useEffect(() => {
    if (!isEdit && watchedTenantId && watchedRoomId) {
      checkDuplicateMutation.mutate({
        roomId: Number(watchedRoomId),
        tenantId: Number(watchedTenantId)
      });
    }
  }, [watchedTenantId, watchedRoomId, isEdit]);

  const createMutation = useMutation({
    mutationFn: roomTenantMappingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-tenant-mappings'] });
      formToast.created(t('boardTenants.boardTenantMapping'));
      navigate('/board-tenants');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoomTenantMappingDto) => roomTenantMappingApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-tenant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['room-tenant-mapping', id] });
      formToast.updated(t('boardTenants.boardTenantMapping'));
      navigate('/board-tenants');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const onSubmit = (data: any) => {
    // Check for duplicate before creating
    if (!isEdit && duplicateCheckResult.exists) {
      showError(t('boardTenants.activeMappingExistsMessage'));
      return;
    }

    const transformedData = {
      ...data,
      leavingDate: data.leavingDate === '' ? null : data.leavingDate,
    };

    if (isEdit) {
      updateMutation.mutate(transformedData as UpdateRoomTenantMappingDto);
    } else {
      createMutation.mutate(transformedData as CreateRoomTenantMappingDto);
    }
  };

  if (mappingLoading) {
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
          onClick={() => navigate('/board-tenants')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? t('boardTenants.editBoardTenantMapping') : t('boardTenants.boardNewTenant')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? t('boardTenants.updateMappingDetails') : t('boardTenants.assignTenantToRoom')}
          </p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {!isEdit && duplicateCheckResult.checked && duplicateCheckResult.exists && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">{t('boardTenants.activeMappingExists')}</h3>
            <p className="text-sm text-red-700 mt-1">
              {t('boardTenants.activeMappingExistsMessage')}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Tenant Selection - Only in create mode */}
        {!isEdit && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('boardTenants.tenantSelection')}</h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('boardTenants.selectTenant')}
                </label>
                <select
                  {...register('tenantId')}
                  className="input"
                  disabled={!selectedOwnerId}
                >
                  <option value="">{t('boardTenants.selectTenantPlaceholder')}</option>
                  {tenants?.data.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.value}
                    </option>
                  ))}
                </select>
                {errors.tenantId && (
                  <p className="text-error-600 text-sm mt-1">{String(errors.tenantId?.message || '')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Room Selection - Only in create mode */}
        {!isEdit && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('boardTenants.roomSelection')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isAdmin() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('properties.owner')} *
                  </label>
                  <select
                    value={selectedOwnerId || ''}
                    onChange={(e) => {
                      setSelectedOwnerId(e.target.value ? Number(e.target.value) : undefined);
                      setSelectedPropertyId(undefined);
                      setValue('roomId', '');
                    }}
                    className="input"
                  >
                    <option value="">{t('properties.selectOwner')}</option>
                    {owners?.data.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isOwner() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('properties.owner')} *
                  </label>
                  <select
                    value={selectedOwnerId || ''}
                    className="input bg-gray-100 cursor-not-allowed"
                    disabled={true}
                  >
                    <option value="">{t('properties.selectOwner')}</option>
                    {owners?.data.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('tenants.ownerHelpText')}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rooms.propertyLabel')} *
                </label>
                <select
                  value={selectedPropertyId || ''}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value ? Number(e.target.value) : undefined);
                    setValue('roomId', '');
                  }}
                  className="input"
                  disabled={!selectedOwnerId}
                >
                  <option value="">{t('rooms.selectProperty')}</option>
                  {properties?.data.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('boardTenants.selectRoom')}
                </label>
                <select
                  {...register('roomId')}
                  className="input"
                  disabled={!selectedPropertyId}
                >
                  <option value="">{t('boardTenants.selectRoomPlaceholder')}</option>
                  {rooms?.data.map((room) => (
                    <option key={room.id} value={room.id}>
                      {t('boardTenants.roomLabel')} {room.value}
                    </option>
                  ))}
                </select>
                {errors.roomId && (
                  <p className="text-error-600 text-sm mt-1">{String(errors.roomId?.message || '')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Display tenant and room in edit mode (read-only) */}
        {isEdit && mapping && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('boardTenants.mappingInformation')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tenants.tenant')}
                </label>
                <input
                  type="text"
                  value={`${t('tenants.tenantId')}: ${mapping.tenantId}`}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled={true}
                />
                <p className="text-gray-500 text-sm mt-1">
                  {t('boardTenants.tenantCannotChange')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('boardTenants.roomLabel')}
                </label>
                <input
                  type="text"
                  value={`${t('boardTenants.roomIdPrefix')} ${mapping.roomId}`}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled={true}
                />
                <p className="text-gray-500 text-sm mt-1">
                  {t('boardTenants.roomCannotChange')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boarding Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('boardTenants.boardingDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('boardTenants.boardingDateLabel')}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('boardTenants.leavingDateLabel')}
              </label>
              <input
                type="date"
                {...register('leavingDate')}
                className="input"
              />
              {errors.leavingDate && (
                <p className="text-error-600 text-sm mt-1">{String(errors.leavingDate?.message || '')}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {t('boardTenants.leavingDateOptionalHelp')}
              </p>
            </div>

            {isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('boardTenants.activeStatusLabel')}
                </label>
                <select {...register('isActive')} className="input">
                  <option value="true">{t('common.active')}</option>
                  <option value="false">{t('common.inactive')}</option>
                </select>
                {errors.isActive && (
                  <p className="text-error-600 text-sm mt-1">{String(errors.isActive?.message || '')}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/board-tenants')}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!isEdit && duplicateCheckResult.exists)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? t('boardTenants.updateMapping') : t('boardTenants.createMapping')}
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

export default BoardTenantForm;
