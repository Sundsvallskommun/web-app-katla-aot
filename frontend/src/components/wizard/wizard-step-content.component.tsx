import { ReporterContent } from '@components/errand-sections/reporter.component';
import { UserContent } from '@components/errand-sections/user.component';
import { AboutErrandContent } from '@components/errand-sections/about-errand.component';
import { OtherPartiesContent } from '@components/errand-sections/other-parties.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { WizardSummary } from './wizard-summary.component';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { useWizardStore } from 'src/stores/wizard-store';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

export const WizardStepContent: React.FC = () => {
  const { t } = useTranslation();
  const currentStep = useWizardStore((s) => s.currentStep);
  const steps = useActiveWizardSteps();
  const step = steps[currentStep];

  const renderStepContent = () => {
    switch (step?.id) {
      case 'about':
        return <AboutErrandContent />;
      case 'reporter':
        return (
          <>
            <ReporterContent />
            {appConfig.features.otherPartiesDisclosure && (
              <div className="mt-24">
                <h2 className="text-h4-md mb-12">{t('errand-information:other_parties.title')}</h2>
                <OtherPartiesContent />
              </div>
            )}
          </>
        );
      case 'user':
        return <UserContent />;
      case 'deviation':
        return <DeviationInformation compact />;
      case 'summary':
        return <WizardSummary />;
      default:
        return null;
    }
  };

  return (
    <div className="px-16 py-24">
      {step?.id !== 'summary' && <h2 className="text-h3-md mb-16">{t(step?.titleKey)}</h2>}
      {renderStepContent()}
    </div>
  );
};
