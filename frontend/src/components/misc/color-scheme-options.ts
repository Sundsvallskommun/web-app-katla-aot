import { ColorSchemeMode } from '@sk-web-gui/react';
import { Monitor, Moon, Sun } from 'lucide-react';

/**
 * Färglägena i den ordning de visas. Ägs på ett ställe så att användarmenyn och
 * mobilmenyn aldrig kan gå isär i värden, etiketter eller ikoner.
 */
export const colorSchemeOptions = [
  { value: ColorSchemeMode.Light, labelKey: 'layout:color_scheme.light', icon: Sun },
  { value: ColorSchemeMode.Dark, labelKey: 'layout:color_scheme.dark', icon: Moon },
  { value: ColorSchemeMode.System, labelKey: 'layout:color_scheme.system', icon: Monitor },
] as const;
