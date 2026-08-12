import { colorSchemeOptions } from '@components/misc/color-scheme-options';
import { PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useTranslation } from 'react-i18next';

export const ColorSchemeItems = () => {
  const { colorScheme, setColorScheme } = useLocalStorage();
  const { t } = useTranslation();

  return (
    <PopupMenu.Items aria-label={t('layout:color_scheme.label')}>
      {colorSchemeOptions.map(({ value, labelKey, icon: Icon }) => (
        <PopupMenu.Item key={value} closeOnClick={false}>
          <RadioButton
            name="user-menu-color-scheme"
            value={value}
            onChange={() => {
              setColorScheme(value);
            }}
            checked={colorScheme === value}
          >
            {t(labelKey)} <Icon aria-hidden="true" className={colorScheme === value ? '' : 'opacity-50'} />
          </RadioButton>
        </PopupMenu.Item>
      ))}
    </PopupMenu.Items>
  );
};
