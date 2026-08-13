'use client';

import { ErrorAlert } from '@components/misc/error-alert.component';
import { Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { CircleAlert } from 'lucide-react';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const FilterOverviewSidebarStatusSelector: React.FC<{
  smallSideBar: boolean;
}> = ({ smallSideBar }) => {
  const { statusButtons, activeStatus, onSelectStatus, isLoading, error } = useStatusButtons();

  return (
    <>
      {error &&
        (smallSideBar ?
          <div role="alert" title={error} className="mb-8 flex justify-center text-error">
            <CircleAlert aria-hidden="true" />
            <span className="sr-only">{error}</span>
          </div>
        : <ErrorAlert className="mb-8" message={error} />)}
      {statusButtons?.map((button) => {
        const isActive = activeStatus === button.label;
        return (
          <Button
            onClick={() => {
              onSelectStatus(button);
            }}
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
