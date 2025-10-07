import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { propertyApi, lookupApi } from '../../services/api';
import { CreatePropertyDto, UpdatePropertyDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { extractErrorMessage } from '../../utils/errorHandler';
import { formToast } from '../../utils/toast';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { useLookup } from '../../contexts/LookupContext';

const PropertyForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { isAdmin, isOwner, user } = useRoleAccess();
  const { lookups } = useLookup();

  // Validation schema with translations
  const schema = useMemo(() => yup.object({
    propertyName: yup.string().required(t('validation.propertyNameRequired')),
    propertyTypeId: yup.number().required(t('validation.propertyTypeRequired')),
    propertySize: yup.string().required(t('validation.propertySizeRequired')),
    propertyRent: yup.number().required(t('validation.propertyRentRequired')).min(0, t('validation.propertyRentMin')),
    statusId: yup.number().required(t('validation.statusRequired')),
    propertyDescription: yup.string().required(t('validation.descriptionRequired')),
    propertyFacility: yup.string().required(t('validation.facilitiesRequired')),
    ownerId: yup.number().required(t('validation.ownerRequired')).min(1),
    address: yup.object({
      street: yup.string().required(t('validation.streetRequired')),
      landMark: yup.string().required(t('validation.landmarkRequired')),
      area: yup.string().required(t('validation.areaRequired')),
      city: yup.string().required(t('validation.cityRequired')),
      pincode: yup.string().required(t('validation.pincodeRequired')).matches(/^\d{6}$/, t('validation.pincodeInvalid')),
      stateId: yup.number().required(t('validation.stateRequired')).min(1),
      countryId: yup.number().required(t('validation.countryRequired')).min(1),
    }),
  }), [t]);

  const { data: owners } = useQuery({
    queryKey: ['owners-lookup'],
    queryFn: lookupApi.getOwners,
  });

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getById(Number(id)),
    enabled: isEdit,
  });

  // Helper function to get smart default values
  const getDefaultValues = () => {
    // Find INR currency or use first available
    const defaultCurrency = lookups.currencies.find(c => c.value === 'INR') || lookups.currencies[0];
    
    // Find Available status or use first available
    const defaultStatus = lookups.availabilityStatuses.find(s => s.value === 'Available') || lookups.availabilityStatuses[0];
    
    // Find India as default country or use first available
    const defaultCountry = lookups.countries.find(c => c.value === 'India') || lookups.countries[0];
    
    // Find Maharashtra as default state or use first available
    const defaultState = lookups.states.find(s => s.value === 'Maharashtra') || lookups.states[0];

    return {
      currencyId: defaultCurrency?.id ? Number(defaultCurrency.id) : undefined,
      statusId: defaultStatus?.id ? Number(defaultStatus.id) : undefined,
      ownerId: isOwner() ? user?.userId : undefined, // Default to current user if Owner
      address: {
        countryId: defaultCountry?.id ? Number(defaultCountry.id) : undefined,
        stateId: defaultState?.id ? Number(defaultState.id) : undefined,
      }
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreatePropertyDto | UpdatePropertyDto>({
    resolver: yupResolver(schema) as any,
    defaultValues: getDefaultValues()
  });

  React.useEffect(() => {
    if (property && isEdit) {
      reset({
        propertyName: property.propertyName,
        propertyTypeId: property.propertyTypeId,
        propertySize: property.propertySize,
        propertyRent: property.propertyRent,
        currencyId: property.currencyId,
        statusId: property.statusId as number,
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
          stateId: property.address.stateId,
          countryId: property.address.countryId,
        } : {
          street: '',
          landMark: '',
          area: '',
          city: '',
          pincode: '',
          stateId: (() => {
            const id = lookups.states.find(s => s.value === 'Maharashtra')?.id || lookups.states[0]?.id;
            return id ? Number(id) : undefined;
          })(),
          countryId: (() => {
            const id = lookups.countries.find(c => c.value === 'India')?.id || lookups.countries[0]?.id;
            return id ? Number(id) : undefined;
          })(),
        }
      });
    }
  }, [property, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: propertyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      formToast.created('Property');
      navigate('/properties');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePropertyDto) => propertyApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      formToast.updated('Property');
      navigate('/properties');
    },
    onError: (error) => {
      const apiError = extractErrorMessage(error);
      if (apiError.errors && apiError.errors.length > 0) {
        formToast.validationError();
      }
    },
  });

  const onSubmit = (data: CreatePropertyDto | UpdatePropertyDto) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdatePropertyDto);
    } else {
      createMutation.mutate(data as CreatePropertyDto);
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
            {isEdit ? t('properties.editProperty') : t('properties.addNewProperty')}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? t('properties.updatePropertyInfo') : t('properties.createNewProperty')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('properties.propertyDetails')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.propertyName')} *
              </label>
              <input
                {...register('propertyName')}
                className="input"
                placeholder={t('properties.propertyNamePlaceholder')}
              />
              {errors.propertyName && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.propertyType')} *
              </label>
              <select {...register('propertyTypeId')} className="input">
                <option value="">{t('properties.selectType')}</option>
                {lookups.propertyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.value}
                  </option>
                ))}
              </select>
              {errors.propertyTypeId && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyTypeId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.propertySize')} *
              </label>
              <input
                {...register('propertySize')}
                className="input"
                placeholder={t('properties.propertySizePlaceholder')}
              />
              {errors.propertySize && (
                <p className="text-error-600 text-sm mt-1">{errors.propertySize.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.monthlyRent')} *
              </label>
              <input
                type="number"
                {...register('propertyRent')}
                className="input"
                placeholder={t('properties.monthlyRentPlaceholder')}
              />
              {errors.propertyRent && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyRent.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.currency')}
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
                {t('common.status')} *
              </label>
              <select {...register('statusId')} className="input">
                <option value="">{t('properties.selectStatus')}</option>
                {lookups.availabilityStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.value}
                  </option>
                ))}
              </select>
              {errors.statusId && (
                <p className="text-error-600 text-sm mt-1">{errors.statusId.message}</p>
              )}
            </div>

            {/* Owner field - visibility and editability based on user role */}
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('properties.owner')} *
                </label>
                <select
                  {...register('ownerId')}
                  className="input"
                >
                  <option value="">{t('properties.selectOwner')}</option>
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
            )}

            {/* For Owner users in add mode - show disabled field */}
            {!isEdit && isOwner() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('properties.owner')} *
                </label>
                <select
                  {...register('ownerId')}
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
                {errors.ownerId && (
                  <p className="text-error-600 text-sm mt-1">{errors.ownerId.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {t('properties.onlyCreateForYourself')}
                </p>
              </div>
            )}

            {/* For Owner users in edit mode - hide the field completely */}
            {isEdit && isOwner() && (
              <input type="hidden" {...register('ownerId')} />
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.description')} *
              </label>
              <textarea
                {...register('propertyDescription')}
                rows={3}
                className="input"
                placeholder={t('properties.descriptionPlaceholder')}
              />
              {errors.propertyDescription && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyDescription.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.facilities')} *
              </label>
              <textarea
                {...register('propertyFacility')}
                rows={3}
                className="input"
                placeholder={t('properties.facilitiesPlaceholder')}
              />
              {errors.propertyFacility && (
                <p className="text-error-600 text-sm mt-1">{errors.propertyFacility.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('properties.addressInfo')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.streetAddress')} *
              </label>
              <input
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
                {t('properties.landmark')} *
              </label>
              <input
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
                {t('properties.area')} *
              </label>
              <input
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
                {t('properties.city')} *
              </label>
              <input
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
                {t('properties.pincode')} *
              </label>
              <input
                {...register('address.pincode')}
                className="input"
                placeholder={t('registration.pincodePlaceholder')}
              />
              {errors.address?.pincode && (
                <p className="text-error-600 text-sm mt-1">{errors.address.pincode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('properties.state')} *
              </label>
              <select {...register('address.stateId')} className="input">
                <option value="">{t('registration.selectState')}</option>
                {lookups.states.map((state) => (
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
                {t('properties.country')} *
              </label>
              <select {...register('address.countryId')} className="input">
                <option value="">{t('registration.selectCountry')}</option>
                {lookups.countries.map((country) => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('properties.additionalInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('properties.notes')}
            </label>
            <textarea
              {...register('note')}
              rows={4}
              className="input"
              placeholder={t('registration.notePlaceholder')}
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
            {isEdit ? t('properties.updateProperty') : t('properties.createProperty')}
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

export default PropertyForm;