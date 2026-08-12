import { ColorSchemeMode, PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ColorSchemeItems = () => {
  const { colorScheme, setColorScheme } = useLocalStorage();
  const { t } = useTranslation();

  const colorSchemeOptions = [
    {
      value: ColorSchemeMode.Light,
      label: t('layout:color_scheme.light'),
      icon: Sun,
    },
    {
      value: ColorSchemeMode.Dark,
      label: t('layout:color_scheme.dark'),
      icon: Moon,
    },
    {
      value: ColorSchemeMode.System,
      label: t('layout:color_scheme.system'),
      icon: Monitor,
    },
  ] as const;

  return (
    <PopupMenu.Items aria-label={t('layout:color_scheme.label')}>
      {colorSchemeOptions.map(({ value, label, icon: Icon }) => (
        <PopupMenu.Item key={value} closeOnClick={false}>
          <RadioButton
            name="user-menu-color-scheme"
            value={value}
            onChange={() => {
              setColorScheme(value);
            }}
            checked={colorScheme === value}
          >
            {label} <Icon aria-hidden="true" className={colorScheme === value ? '' : 'opacity-50'} />
          </RadioButton>
        </PopupMenu.Item>
      ))}
    </PopupMenu.Items>
  );
};
