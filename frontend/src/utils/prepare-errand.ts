import {
  errandFormDataForSchemas,
  errandFormDataToJsonParameters,
  schemaNamesForErrand,
} from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';

export const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
  const { errandFormData, ...errandWithoutFormData } = values;
  const labels = errandWithoutFormData.labels ?? [];

  return {
    ...errandWithoutFormData,
    stakeholders: errandWithoutFormData.stakeholders ?? [],
    labels,
    status,
    // Only the current ärendetyp's form is filed; a type the citizen changed away from leaves its
    // answers in form state but must not reach the errand.
    jsonParameters: errandFormDataToJsonParameters(
      errandFormDataForSchemas(errandFormData, schemaNamesForErrand(labels))
    ),
  };
};
