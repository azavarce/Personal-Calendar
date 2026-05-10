import { useColorScheme } from 'react-native';
import { getPalette, type Palette, type ThemeMode } from './colors';
import { useThemeOverride } from './theme-context';

export type Theme = {
  mode: ThemeMode;
  palette: Palette;
};

/**
 * Resolves the active theme. Reads the user's stored override
 * (system / light / dark) from ThemeOverrideContext, falling back to the
 * device color scheme when the override is "system". Returns 'light' if
 * the OS hasn't yet reported a scheme (briefly, on cold start).
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const override = useThemeOverride();
  const effective = override === 'system' ? scheme : override;
  const mode: ThemeMode = effective === 'dark' ? 'dark' : 'light';
  return { mode, palette: getPalette(mode) };
}
