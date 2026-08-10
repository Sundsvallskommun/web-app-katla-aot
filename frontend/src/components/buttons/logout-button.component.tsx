'use client';

import { Button, cx } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps {
  smallSideBar?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ smallSideBar = false }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  const logOutString = capitalize(t('common:logout'));

  return (
    <div className="flex justify-center w-full">
      <Button
        data-cy="logout-button"
        onClick={handleLogout}
        variant="ghost"
        size="md"
        color="primary"
        className={cx('w-full hover:bg-dark-ghost', !smallSideBar ? 'justify-start' : '')}
        leftIcon={<LogOut />}
        aria-label={logOutString}
        iconButton={smallSideBar}
      >
        {!smallSideBar && <span className="w-full flex justify-between">{logOutString}</span>}
      </Button>
    </div>
  );
};
