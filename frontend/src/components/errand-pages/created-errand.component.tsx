'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { Reporter } from '@components/errand-sections/reporter.component';
import { User } from '@components/errand-sections/user.component';
import { jsonParametersToErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { getErrandUsingErrandNumber } from '@services/errand-service/errand-service';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { appConfig } from 'src/config/appconfig';

export const CreatedErrand: React.FC = () => {
  const context = useFormContext<ErrandFormDTO>();
  const pathName = usePathname();

  useEffect(() => {
    void getErrandUsingErrandNumber(pathName?.split('/')[2]).then((res) => {
      const errandFormData = jsonParametersToErrandFormData(res.jsonParameters);
      context.reset({ ...res, errandFormData });
    });
  }, []);

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
