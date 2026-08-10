'use client';

import { Button } from '@sk-web-gui/react';
import { X } from 'lucide-react';
import { ReactElement, ReactNode } from 'react';

interface MobileOverlayPageProps {
  title: string;
  icon?: ReactElement;
  onClose: () => void;
  children: ReactNode;
}

export const MobileOverlayPage: React.FC<MobileOverlayPageProps> = ({ title, icon, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background-content pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between px-16 py-12 border-b-1 border-divider min-h-[56px]">
        <div className="flex items-center gap-12 text-h4-sm font-bold">
          {icon}
          <span>{title}</span>
        </div>
        <Button iconButton variant="tertiary" aria-label="Stäng" onClick={onClose} className="min-w-[44px] min-h-[44px]">
          <X />
        </Button>
      </header>
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};
