import { errandFormDataToJsonParameters } from '@components/json/utils/schema-utils';
import { LabelDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO, ErrandFormDataItem } from '@interfaces/errand-form';
import { useMetadataStore } from 'src/stores/metadata-store';

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

  const buildLabels = (eventType: string): LabelDTO[] => {
    const labels: LabelDTO[] = [];

    const uncategorizedLabel = findLabel('UNCATEGORIZED');
    if (uncategorizedLabel) {
      labels.push(...flattenLabel(uncategorizedLabel));
    }

    if (eventType === 'MISSFORHALLANDE') {
      const adverseLabel = findLabel('ADVERSE_INCIDENT');
      if (adverseLabel) {
        labels.push(...flattenLabel(adverseLabel));
      }
    }

    return labels;
  };

  const getFacilityOrgName = (errandFormData: ErrandFormDataItem[] | undefined): string | undefined => {
    const platsEntry = errandFormData?.find((e) => e.schemaName === 'avvikelse-plats-handelse');
    if (!platsEntry?.data) return undefined;
    const parsed = JSON.parse(platsEntry.data);
    for (const value of Object.values(parsed)) {
      if (value && typeof value === 'object' && 'orgName' in (value as Record<string, unknown>)) {
        return (value as Record<string, string>).orgName;
      }
    }
    return undefined;
  };

  const prepareErrandForApi = (values: ErrandFormDTO, status: string) => {
    const { errandFormData, ...errandWithoutFormData } = values;
    const eventType = values.parameters?.find((p) => p.key === 'eventType')?.values?.[0] ?? '';
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

    let stakeholders = errandWithoutFormData.stakeholders ?? [];

    if (eventConcerns === 'GRUPP_VERKSAMHET') {
      const orgName = getFacilityOrgName(errandFormData);
      if (orgName) {
        const facilityStakeholder: StakeholderDTO = {
          firstName: orgName,
          role: 'PRIMARY',
        };
        stakeholders = [...stakeholders.filter((s) => s.role !== 'PRIMARY'), facilityStakeholder];
      }
    }

    return {
      ...errandWithoutFormData,
      stakeholders,
      status,
      labels: buildLabels(eventType),
      jsonParameters: errandFormDataToJsonParameters(errandFormData),
    };
  };

  return { prepareErrandForApi, getFacilityOrgName };
}
