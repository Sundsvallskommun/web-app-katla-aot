'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { User } from '@components/errand-sections/user.component';
import { appConfig } from 'src/config/appconfig';

export const RegisterErrand: React.FC = () => {
  return (
    <div className="flex flex-col gap-32">
      <h2 className="text-h2-md text-dark-primary">1. Grundinformation</h2>
      <AboutErrand />
      <Reporter />
      <User />
      {appConfig.features.otherPartiesDisclosure && <OtherParties />}
      <h2 className="text-h2-md text-dark-primary">2. Ärendeuppgifter</h2>
      <DeviationInformation />
    </div>
  );
};

