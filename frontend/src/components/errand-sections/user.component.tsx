import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { StakeholderList } from '@components/misc/stakeholder.component';
import { User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const UserContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <span className="text-dark-secondary">{t('errand-information:user.description')}</span>
      <StakeholderList roles={['PRIMARY']} hideRoleSelect />
    </div>
  );
};

export const User: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:user.title')} icon={<UserIcon />} initialOpen={false}>
      <UserContent />
    </ErrandDisclosure>
  );
};
