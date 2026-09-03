import { errandFormDataToJsonParameters } from '@components/json/utils/schema-utils';
import { LabelDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { useMetadataStore } from 'src/stores/metadata-store';

/**
 * The label every errand gets until AoT has its own categorisation. What it will be based on
 * (category or errand type, most likely) is not decided, so only the neutral base label is sent.
 */
const DEFAULT_LABEL = 'UNCATEGORIZED';

export function usePrepareErrand() {
  const { metadata } = useMetadataStore();

  const findLabel = (resourceName: string): LabelDTO | undefined => {
    const findInStructure = (labels: LabelDTO[]): LabelDTO | undefined => {
      for (const label of labels) {
        if (label.resourceName === resourceName) return label;
        if (label.labels?.length) {
          const found = findInStructure(label.labels);
          if (found) return found;
        }
      }
      return undefined;
    };
    return metadata?.labels?.labelStructure ? findInStructure(metadata.labels.labelStructure) : undefined;
  };

  const flattenLabel = (label: LabelDTO): LabelDTO[] => {
    const { labels: children, ...labelWithoutChildren } = label;
    const result: LabelDTO[] = [labelWithoutChildren];
    if (children?.length) {
      children.forEach((child) => result.push(...flattenLabel(child)));
    }
    return result;
  };

  const buildLabels = (): LabelDTO[] => {
    const defaultLabel = findLabel(DEFAULT_LABEL);
    return defaultLabel ? flattenLabel(defaultLabel) : [];
  };

  const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
    const { errandFormData, ...errandWithoutFormData } = values;

    return {
      ...errandWithoutFormData,
      stakeholders: errandWithoutFormData.stakeholders ?? [],
      status,
      labels: buildLabels(),
      jsonParameters: errandFormDataToJsonParameters(errandFormData),
    };
  };

  return { prepareErrandForApi };
}
