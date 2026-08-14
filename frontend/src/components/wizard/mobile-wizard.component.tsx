import { useEffect } from 'react';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';

import { WizardBottomBar } from './wizard-bottom-bar.component';
import { WizardHeader } from './wizard-header.component';
import { WizardStepContent } from './wizard-step-content.component';

export const MobileWizard: React.FC = () => {
  const steps = useActiveWizardSteps();
  const currentStep = useWizardStore((s) => s.currentStep);
  const goToStep = useWizardStore((s) => s.goToStep);
  const lastStep = steps.length - 1;

  // Antalet steg krymper när eventConcerns ändras från ENSKILD_BRUKARE, och
  // currentStep ligger kvar i sessionStorage. Utan klampningen pekar det
  // sparade steget utanför listan och wizarden renderar ett tomt steg.
  useEffect(() => {
    if (currentStep > lastStep) {
      goToStep(lastStep);
    }
  }, [currentStep, goToStep, lastStep]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WizardHeader />
      <main id="content" tabIndex={-1} className="flex-1 overflow-y-auto min-h-0">
        <WizardStepContent />
      </main>
      <WizardBottomBar />
    </div>
  );
};
