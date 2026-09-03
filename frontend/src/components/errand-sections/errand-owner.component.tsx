import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ErrandOwnerContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <span className="text-dark-secondary">{t('errand-information:owner.description')}</span>
      <span className="text-dark-secondary">{t('errand-information:section_placeholder')}</span>
    </div>
  );
};

export const ErrandOwner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:owner.title')} icon={<Building2 />}>
      <ErrandOwnerContent />
    </ErrandDisclosure>
  );
};
