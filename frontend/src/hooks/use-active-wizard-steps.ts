import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { getActiveWizardSteps, WizardStep } from '@components/wizard/wizard-steps';

export function useActiveWizardSteps(): WizardStep[] {
  const { watch } = useFormContext<ErrandDTO>();
  const parameters = watch('parameters') || [];
  const eventConcerns = parameters.find((p) => p.key === 'eventConcerns')?.values?.[0] ?? '';

  return useMemo(() => getActiveWizardSteps(eventConcerns), [eventConcerns]);
}
