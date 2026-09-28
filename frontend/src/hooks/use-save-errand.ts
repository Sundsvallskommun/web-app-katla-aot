'use client';

import i18nConfig from '@app/i18nConfig';
import {
  errandFormDataContractErrorMessage,
  errandFormDataForSchemas,
  jsonParametersToErrandFormData,
  schemaNamesForErrand,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO, ErrandLifecycle } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { useSnackbar } from '@sk-web-gui/react';
import { prepareErrandForApi } from '@utils/prepare-errand';
import { getPrimaryStakeholder } from '@utils/stakeholder';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAttachmentUpload } from 'src/hooks/use-attachment-upload';
import { useMetadataStore } from 'src/stores/metadata-store';

const errandPath = (errand: ErrandDTO): string => `/arende/${errand.errandNumber}/grundinformation`;

/**
 * Saving is the same sequence for the desktop button group and the wizard: prepare, create or
 * update, send the pending bilagor, then reset the form to what upstream answered.
 */
export const useSaveErrand = () => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toastMessage = useSnackbar();
  const router = useRouter();
  const { getValues, reset, watch } = useFormContext<ErrandFormDTO>();
  const { setShowValidation, focusFirstError } = useFormValidation();
  const namespace = useMetadataStore((state) => state.metadata?.namespace);
  const uploadAttachments = useAttachmentUpload();
  const errandId = watch('id');

  const save = async (lifecycle: ErrandLifecycle, successMessage: string): Promise<ErrandDTO | undefined> => {
    try {
      const errandData = prepareErrandForApi(getValues(), lifecycle, namespace);
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      await uploadAttachments(errand.id, getValues('attachments'));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: successMessage });
      reset({ ...errand, errandFormData });
      return errand;
    } catch (error: unknown) {
      toastMessage({
        position: 'bottom',
        status: 'error',
        message: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
      return undefined;
    }
  };

  // The message says what is missing and the fields show it, so it can be fixed at once.
  const reportValidationError = (message: string) => {
    setShowValidation(true);
    toastMessage({ position: 'bottom', status: 'error', message });
    focusFirstError();
  };

  /**
   * A draft is held to the same checks as registration for what it files: without an owner it
   * would fall outside every organisation the session scopes by, and upstream validates the filed
   * answers against the schema, so an invalid form is shown here rather than answered with 400.
   * A form not yet opened is not filed and passes. `navigate` opens the saved errand; a draft
   * reopened from the list stays where it is.
   */
  const saveDraft = async ({ navigate }: { navigate: boolean }): Promise<void> => {
    const values = getValues();

    if (!getPrimaryStakeholder(values.stakeholders)) {
      reportValidationError(t('validation:owner.required'));
      return;
    }

    const filedFormData = errandFormDataForSchemas(
      values.errandFormData,
      schemaNamesForErrand(values.labels, namespace)
    );
    const formDataErrors = await validateErrandFormData(
      filedFormData,
      tForms,
      locale,
      filedFormData.map((entry) => entry.schemaName)
    );
    if (formDataErrors.length > 0) {
      reportValidationError(formDataErrors[0]);
      return;
    }

    const errand = await save('DRAFT', t('errand-information:save_message.draft'));
    if (errand && navigate) router.push(errandPath(errand));
  };

  const register = async ({ logout = false }: { logout?: boolean } = {}): Promise<void> => {
    const errand = await save('ACTIVE', t('errand-information:save_message.register'));
    if (errand) router.push(logout ? '/logout' : errandPath(errand));
  };

  return { saveDraft, register };
};
