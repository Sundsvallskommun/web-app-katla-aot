import { errandFormDataToJsonParameters } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';

export const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
  const { errandFormData, ...errandWithoutFormData } = values;

  return {
    ...errandWithoutFormData,
    stakeholders: errandWithoutFormData.stakeholders ?? [],
    labels: errandWithoutFormData.labels ?? [],
    status,
    jsonParameters: errandFormDataToJsonParameters(errandFormData),
  };
};
