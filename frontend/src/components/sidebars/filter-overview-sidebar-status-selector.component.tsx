'use client';

import { Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const FilterOverviewSidebarStatusSelector: React.FC<{
  smallSideBar: boolean;
}> = ({ smallSideBar }) => {
  const { statusButtons, activeStatus, onSelectStatus, isLoading } = useStatusButtons();

  return (
    <>
      {statusButtons?.map((button) => {
        const isActive = activeStatus === button.label;
        return (
          <Button
            onClick={() => onSelectStatus(button)}
            aria-label={`status-button-${button.label}`}
            variant={isActive ? 'primary' : 'ghost'}
            className={`${!smallSideBar && 'justify-start'} ${!isActive && 'hover:bg-dark-ghost'}`}
            leftIcon={button.icon}
            key={button.label}
            iconButton={smallSideBar}
          >
            {!smallSideBar && (
              <span className="w-full flex justify-between">
                {capitalize(button.label)}
                <Badge
                  className="min-w-fit px-4"
                  inverted={!isActive}
                  color={isActive ? 'tertiary' : 'vattjom'}
                  counter={
                    isLoading ? '-'
                    : button.errandsCount > 999 ?
                      '999+'
                    : button.errandsCount || '0'
                  }
                />
              </span>
            )}
          </Button>
        );
      })}
    </>
  );
};
