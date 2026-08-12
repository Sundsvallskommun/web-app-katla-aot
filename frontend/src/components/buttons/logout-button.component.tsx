'use client';

import { Button, cx } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'> {
  smallSideBar?: boolean;
  testId?: string;
}

export const LogoutButton = forwardRef<HTMLButtonElement, LogoutButtonProps>((props, ref) => {
  const { className, onClick, smallSideBar = false, testId = 'logout-button', ...rest } = props;
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  const logOutString = capitalize(t('common:logout'));

  return (
    <Button
      {...rest}
      ref={ref}
      data-cy={testId}
      onClick={(event) => {
        onClick?.(event);
        handleLogout();
      }}
      variant="ghost"
      size="md"
      color="primary"
      className={cx('flex w-full hover:bg-dark-ghost', smallSideBar ? 'justify-center' : 'justify-start', className)}
      leftIcon={<LogOut aria-hidden="true" />}
      aria-label={logOutString}
      iconButton={smallSideBar}
    >
      {!smallSideBar && <span className="w-full flex justify-between">{logOutString}</span>}
    </Button>
  );
});

LogoutButton.displayName = 'LogoutButton';
