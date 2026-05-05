import { useColorScheme } from 'react-native';
import { getPalette, type Palette, type ThemeMode } from './colors';

export type Theme = {
  mode: ThemeMode;
  palette: Palette;
};

/**
 * Follows the system color scheme. No in-app toggle in v0 — dark/light is
 * controlled by the device per the brief. Returns 'light' as the default
 * when the OS hasn't yet reported a scheme (briefly, on cold start).
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';
  return { mode, palette: getPalette(mode) };
}
