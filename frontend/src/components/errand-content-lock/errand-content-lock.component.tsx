'use client';

import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { cx } from '@sk-web-gui/react';
import { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

interface ErrandContentLockProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ErrandContentLock: React.FC<ErrandContentLockProps> = ({ children, className, disabled = false }) => {
  const { watch } = useFormContext<ErrandDTO>();
  const isLocked = disabled || watch('status') !== 'DRAFT';

  return (
    <fieldset
      aria-disabled={isLocked}
      className={cx('min-w-0 border-0 p-0 m-0', isLocked && 'pointer-events-none opacity-80', className)}
      disabled={isLocked}
    >
      {children}
    </fieldset>
  );
};
