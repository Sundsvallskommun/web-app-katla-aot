'use client';

import { Alert, Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const MobileStatusTabs: React.FC = () => {
  const { statusButtons, activeStatus, onSelectStatus, isLoading, error } = useStatusButtons();

  return (
    <div>
      {error && (
        <div role="alert" className="mx-16 mt-8">
          <Alert type="error">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Description>{error}</Alert.Content.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
      <div className="flex gap-8 overflow-x-auto px-16 py-8 no-scrollbar">
        {statusButtons.map((button) => {
          const isActive = activeStatus === button.label;
          return (
            <Button
              key={button.label}
              onClick={() => {
                onSelectStatus(button);
              }}
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
    </div>
  );
};
