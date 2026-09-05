/**
 * Single Source of Truth (SOT) Theme Manager for AI-Tools Hub and Miniapps.
 * Supports: 'light' | 'dark' | 'system'
 */

export const THEME_STORAGE_KEY = 'ai_tools_theme';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
});

const VALID_THEMES = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM];

/**
 * Get stored theme preference from storage (defaults to window.localStorage).
 * @param {Storage} [storage]
 * @returns {'light' | 'dark' | 'system'}
 */
export function getStoredThemePreference(storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return THEMES.SYSTEM;
    const value = s.getItem(THEME_STORAGE_KEY);
    return VALID_THEMES.includes(value) ? value : THEMES.SYSTEM;
  } catch {
    return THEMES.SYSTEM;
  }
}

/**
 * Save theme preference to storage.
 * @param {'light' | 'dark' | 'system'} preference
 * @param {Storage} [storage]
 */
export function setStoredThemePreference(preference, storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return;
    const value = VALID_THEMES.includes(preference) ? preference : THEMES.SYSTEM;
    s.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Gracefully handle storage errors (e.g., privacy mode quota)
  }
}

/**
 * Check the system OS color scheme preference.
 * @param {Window} [win]
 * @returns {'light' | 'dark'}
 */
export function getSystemTheme(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    if (w && typeof w.matchMedia === 'function') {
      return w.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
    }
  } catch {
    // Ignore matchMedia error
  }
  return THEMES.DARK; // Fallback to dark if undetermined
}

/**
 * Resolve effective theme ('light' or 'dark') given a preference.
 * @param {'light' | 'dark' | 'system'} preference
 * @param {Window} [win]
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(preference, win) {
  if (preference === THEMES.LIGHT || preference === THEMES.DARK) {
    return preference;
  }
  return getSystemTheme(win);
}

/**
 * Apply resolved theme to document root.
 * @param {'light' | 'dark'} resolvedTheme
 * @param {Document} [doc]
 */
export function applyThemeToDom(resolvedTheme, doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.documentElement) return;

  const target = d.documentElement;
  const isDark = resolvedTheme === THEMES.DARK;

  target.setAttribute('data-theme', resolvedTheme);
  if (isDark) {
    target.classList.add('dark');
    target.classList.remove('light');
  } else {
    target.classList.add('light');
    target.classList.remove('dark');
  }

  if (target.style) {
    target.style.colorScheme = resolvedTheme;
  }
}

/**
 * High-level function: Set theme preference, update storage, apply to DOM, and notify.
 * @param {'light' | 'dark' | 'system'} preference
 * @param {{ storage?: Storage, doc?: Document, win?: Window }} [options]
 * @returns {{ preference: string, resolvedTheme: string }}
 */
export function applyTheme(preference, options = {}) {
  const validPref = VALID_THEMES.includes(preference) ? preference : THEMES.SYSTEM;
  setStoredThemePreference(validPref, options.storage);
  const resolved = resolveTheme(validPref, options.win);
  applyThemeToDom(resolved, options.doc);
  return { preference: validPref, resolvedTheme: resolved };
}

/**
 * Initialize theme on startup.
 * @param {{ storage?: Storage, doc?: Document, win?: Window }} [options]
 * @returns {{ preference: string, resolvedTheme: string }}
 */
export function initTheme(options = {}) {
  const preference = getStoredThemePreference(options.storage);
  const resolvedTheme = resolveTheme(preference, options.win);
  applyThemeToDom(resolvedTheme, options.doc);
  return { preference, resolvedTheme };
}

/**
 * Subscribe to external theme change events:
 * 1. System OS dark/light switch (when preference is 'system')
 * 2. Cross-tab localStorage changes
 *
 * @param {(state: { preference: string, resolvedTheme: string }) => void} callback
 * @param {{ storage?: Storage, doc?: Document, win?: Window }} [options]
 * @returns {() => void} Unsubscribe function
 */
export function subscribeTheme(callback, options = {}) {
  const w = options.win || (typeof window !== 'undefined' ? window : null);
  if (!w) return () => {};

  // 1. OS color scheme listener
  let mediaQueryList = null;
  const handleMediaChange = () => {
    const currentPref = getStoredThemePreference(options.storage);
    if (currentPref === THEMES.SYSTEM) {
      const resolved = resolveTheme(THEMES.SYSTEM, w);
      applyThemeToDom(resolved, options.doc);
      callback({ preference: THEMES.SYSTEM, resolvedTheme: resolved });
    }
  };

  try {
    if (typeof w.matchMedia === 'function') {
      mediaQueryList = w.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', handleMediaChange);
      } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(handleMediaChange);
      }
    }
  } catch {
    // MatchMedia subscription unsupported
  }

  // 2. Cross-tab storage synchronization listener
  const handleStorageChange = (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      const newPref = getStoredThemePreference(options.storage);
      const resolved = resolveTheme(newPref, w);
      applyThemeToDom(resolved, options.doc);
      callback({ preference: newPref, resolvedTheme: resolved });
    }
  };

  w.addEventListener('storage', handleStorageChange);

  return () => {
    if (mediaQueryList) {
      if (typeof mediaQueryList.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', handleMediaChange);
      } else if (typeof mediaQueryList.removeListener === 'function') {
        mediaQueryList.removeListener(handleMediaChange);
      }
    }
    w.removeEventListener('storage', handleStorageChange);
  };
}
