'use client';

import { AboutErrand } from '@components/errand-sections/about-errand.component';
import { ErrandDetails } from '@components/errand-sections/errand-details.component';
import { ErrandOwner } from '@components/errand-sections/errand-owner.component';
import { OtherParties } from '@components/errand-sections/other-parties.component';
import { useErrandLockedByStatus } from '@contexts/errand-content-lock-context';
import { Alert } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

export const CreatedErrand: React.FC = () => {
  const { t } = useTranslation();
  const isLocked = useErrandLockedByStatus();

  return (
    <div className="flex flex-col gap-32">
      {/* Avsnitten nedan är inaktiverade när ärendet är inlämnat. Utan en
          förklaring syns bara att ingenting går att ändra, inte varför. */}
      {isLocked && (
        <div data-cy="read-only-notice" role="status">
          <Alert type="info">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Description>{t('errand-information:read_only.notice')}</Alert.Content.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
      <h2 className="text-h2-md text-dark-primary">{t('errand-information:basic_information_heading')}</h2>
      <AboutErrand />
      <ErrandOwner />
      {appConfig.features.otherPartiesDisclosure && <OtherParties />}
      <h2 className="text-h2-md text-dark-primary">{t('errand-information:errand_details_heading')}</h2>
      <ErrandDetails />
    </div>
  );
};
