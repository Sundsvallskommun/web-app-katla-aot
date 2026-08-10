import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';
import { Button, Label } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

export const WizardSummary: React.FC = () => {
  const { t } = useTranslation();
  const goToStep = useWizardStore((s) => s.goToStep);
  const stepErrors = useWizardStore((s) => s.stepErrors);
  const steps = useActiveWizardSteps();

  const stepsToReview = steps.filter((s) => s.id !== 'summary');

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-h3-md">{t('errand-information:wizard.summary')}</h2>
      {stepsToReview.map((step, index) => {
        const hasErrors = (stepErrors[index] ?? []).length > 0;
        return (
          <div
            key={step.id}
            className="flex items-center justify-between border-1 border-divider rounded-12 p-16"
          >
            <div className="flex items-center gap-12">
              <Label color={hasErrors ? 'error' : 'vattjom'} inverted rounded>
                {hasErrors ?
                  t('errand-information:wizard.incomplete')
                : t('errand-information:wizard.complete')}
              </Label>
              <span className="font-bold">{t(step.titleKey)}</span>
            </div>
            <Button size="sm" variant="link" onClick={() => goToStep(index)}>
              {t('errand-information:wizard.edit')}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
