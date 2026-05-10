import { createContext, type ReactNode, useContext } from 'react';

export type SchemeOverride = 'system' | 'light' | 'dark';

const ThemeOverrideContext = createContext<SchemeOverride>('system');

export function ThemeOverrideProvider({
  value,
  children,
}: {
  value: SchemeOverride;
  children: ReactNode;
}) {
  return (
    <ThemeOverrideContext.Provider value={value}>
      {children}
    </ThemeOverrideContext.Provider>
  );
}

/** Reads the user's saved override (system / light / dark). System by default. */
export function useThemeOverride(): SchemeOverride {
  return useContext(ThemeOverrideContext);
}
