import { WizardHeader } from './wizard-header.component';
import { WizardStepContent } from './wizard-step-content.component';
import { WizardBottomBar } from './wizard-bottom-bar.component';

export const MobileWizard: React.FC = () => {
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
