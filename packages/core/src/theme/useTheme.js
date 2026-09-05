import { useState, useEffect, useCallback } from 'react';
import {
  THEMES,
  getStoredThemePreference,
  resolveTheme,
  applyTheme,
  applyThemeToDom,
  subscribeTheme,
} from './themeManager.js';

/**
 * React Hook to interact with the Single Source of Truth Theme Manager.
 * @returns {{
 *   themePreference: 'light' | 'dark' | 'system',
 *   resolvedTheme: 'light' | 'dark',
 *   setTheme: (theme: 'light' | 'dark' | 'system') => void,
 *   toggleTheme: () => void,
 *   isDark: boolean,
 *   isLight: boolean,
 *   isSystem: boolean
 * }}
 */
export function useTheme() {
  const [state, setState] = useState(() => {
    const preference = getStoredThemePreference();
    const resolved = resolveTheme(preference);
    return { preference, resolvedTheme: resolved };
  });

  useEffect(() => {
    // Synchronize DOM with the current resolved theme
    applyThemeToDom(state.resolvedTheme);

    // Subscribe to OS theme changes and cross-tab storage updates
    const unsubscribe = subscribeTheme((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [state.resolvedTheme]);

  const setTheme = useCallback((preference) => {
    const updated = applyTheme(preference);
    setState(updated);
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: light -> dark -> system -> light
    setState((prev) => {
      let nextPref = THEMES.DARK;
      if (prev.preference === THEMES.LIGHT) nextPref = THEMES.DARK;
      else if (prev.preference === THEMES.DARK) nextPref = THEMES.SYSTEM;
      else nextPref = THEMES.LIGHT;

      const updated = applyTheme(nextPref);
      return updated;
    });
  }, []);

  return {
    themePreference: state.preference,
    resolvedTheme: state.resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: state.resolvedTheme === THEMES.DARK,
    isLight: state.resolvedTheme === THEMES.LIGHT,
    isSystem: state.preference === THEMES.SYSTEM,
  };
}

export default useTheme;
