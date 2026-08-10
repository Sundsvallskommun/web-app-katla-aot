import { Checkbox, Disclosure, Divider, FormControl, Label } from '@sk-web-gui/react';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { appConfig } from 'src/config/appconfig';

export const ErrandDisclosure: React.FC<{
  header: string;
  icon: ReactElement;
  children: ReactNode;
  errandInformationSection?: boolean;
  disabled?: boolean;
  initialOpen?: boolean;
}> = ({ header, icon, children, errandInformationSection, disabled = false, initialOpen = true }) => {
  const [open, setOpen] = useState(!disabled);
  const [doneMark, setDoneMark] = useState(false);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    } else {
      setOpen(initialOpen);
    }
  }, [disabled, initialOpen]);

  useEffect(() => {
    if (doneMark) {
      setOpen(!open);
    }
  }, [doneMark]);

  const handleToggleOpen = (isOpen: boolean) => {
    if (!disabled) {
      setOpen(isOpen);
    }
  };

  return (
    <FormControl className="w-full" disabled={disabled}>
      <Disclosure
        variant="alt"
        className="w-full mobileVersion"
        open={open}
        onToggleOpen={handleToggleOpen}
        disabled={disabled}
      >
        <Disclosure.Header>
          <Disclosure.Icon icon={icon} />
          <Disclosure.Title>{header}</Disclosure.Title>
          {doneMark && (
            <Label inverted rounded color="gronsta">
              Komplett
            </Label>
          )}
          <Disclosure.Button />
        </Disclosure.Header>
        <Disclosure.Content>
          {children}
          {errandInformationSection && <Divider className="pt-20" />}

          {appConfig.features.disclosureDoneMark && (
            <Checkbox
              onClick={() => {
                setDoneMark(!doneMark);
              }}
              checked={doneMark}
            >
              Markera avsnittet som komplett
            </Checkbox>
          )}
        </Disclosure.Content>
      </Disclosure>
    </FormControl>
  );
};
