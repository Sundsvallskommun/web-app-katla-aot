import { ProgressBar, ProgressStepper } from '@sk-web-gui/react';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';
import { useTranslation } from 'react-i18next';

interface WizardHeaderProps {
  variant?: 'bar' | 'stepper';
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ variant = 'bar' }) => {
  const { t } = useTranslation();
  const currentStep = useWizardStore((s) => s.currentStep);
  const steps = useActiveWizardSteps();

  return (
    <div className="flex flex-col gap-12 px-16 py-12 bg-background-content border-b-1 border-divider">
      <span className="text-small font-bold">
        {t('errand-information:wizard.step_indicator', {
          current: currentStep + 1,
          total: steps.length,
        })}
      </span>
      {variant === 'bar' ?
        <ProgressBar steps={steps.length} current={currentStep + 1} size="sm" color="vattjom" />
      : <ProgressStepper
          steps={steps.map((step) => t(step.titleKey))}
          current={currentStep}
          size="sm"
          labelPosition="bottom"
          noWrap
        />
      }
    </div>
  );
};
