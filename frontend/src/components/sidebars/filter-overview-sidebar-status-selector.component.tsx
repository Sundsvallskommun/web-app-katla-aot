'use client';

import { Alert, Badge, Button } from '@sk-web-gui/react';
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
        : <div role="alert" className="mb-8">
            <Alert type="error">
              <Alert.Icon />
              <Alert.Content>
                <Alert.Content.Description>{error}</Alert.Content.Description>
              </Alert.Content>
            </Alert>
          </div>)}
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
