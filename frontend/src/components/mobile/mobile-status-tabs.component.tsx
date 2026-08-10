'use client';

import { Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const MobileStatusTabs: React.FC = () => {
  const { statusButtons, activeStatus, onSelectStatus, isLoading } = useStatusButtons();

  return (
    <div className="flex gap-8 overflow-x-auto px-16 py-8 no-scrollbar">
      {statusButtons.map((button) => {
        const isActive = activeStatus === button.label;
        return (
          <Button
            key={button.label}
            onClick={() => onSelectStatus(button)}
            variant={isActive ? 'primary' : 'ghost'}
            size="sm"
            className="flex-shrink-0 min-h-[44px] gap-8"
            leftIcon={button.icon}
            aria-label={`status-${button.label}`}
          >
            {capitalize(button.label)}
            <Badge
              className="min-w-fit px-4 ml-4"
              inverted={!isActive}
              color={isActive ? 'tertiary' : 'vattjom'}
              counter={
                isLoading ? '-'
                : button.errandsCount > 999 ?
                  '999+'
                : button.errandsCount || '0'
              }
            />
          </Button>
        );
      })}
    </div>
  );
};
