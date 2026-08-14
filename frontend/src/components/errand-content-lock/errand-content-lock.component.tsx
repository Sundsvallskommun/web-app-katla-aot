'use client';

import { ErrandContentLockContext, useErrandLockedByStatus } from '@contexts/errand-content-lock-context';
import { cx } from '@sk-web-gui/react';
import { ReactNode } from 'react';

interface ErrandContentLockProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ErrandContentLock: React.FC<ErrandContentLockProps> = ({ children, className, disabled = false }) => {
  const lockedByStatus = useErrandLockedByStatus();
  const isLocked = disabled || lockedByStatus;

  return (
    <ErrandContentLockContext.Provider value={isLocked}>
      <fieldset
        aria-disabled={isLocked}
        className={cx('min-w-0 border-0 p-0 m-0', isLocked && 'pointer-events-none opacity-80', className)}
        disabled={isLocked}
      >
        {children}
      </fieldset>
    </ErrandContentLockContext.Provider>
  );
};
