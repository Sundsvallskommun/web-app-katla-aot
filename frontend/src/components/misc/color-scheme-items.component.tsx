import { ColorSchemeMode, PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Monitor, Moon, Sun } from 'lucide-react';

export const ColorSchemeItems = () => {
  const { colorScheme, setColorScheme } = useLocalStorage();

  return (
    <PopupMenu.Items>
      <PopupMenu.Item>
        <RadioButton
          value={'light'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Light);
          }}
          checked={colorScheme === ColorSchemeMode.Light}
        >
          Ljust <Sun className={colorScheme === ColorSchemeMode.Light ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={'dark'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Dark);
          }}
          checked={colorScheme === ColorSchemeMode.Dark}
        >
          Mörkt <Moon className={colorScheme === ColorSchemeMode.Dark ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={'system'}
          onClick={() => {
            setColorScheme(ColorSchemeMode.System);
          }}
          checked={colorScheme === ColorSchemeMode.System}
        >
          System <Monitor className={colorScheme === ColorSchemeMode.System ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
    </PopupMenu.Items>
  );
};
