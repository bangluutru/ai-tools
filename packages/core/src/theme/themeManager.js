/**
 * Single Source of Truth (SOT) Theme Manager for AI-Tools Hub and Miniapps.
 *
 * Two independent axes:
 *   - theme (đậm/nhạt) : 'light' | 'dark' | 'system'  → <html data-theme>
 *   - skin  (phong cách): 'toolio' | 'chotto'         → <html data-skin>
 *
 * Both axes write to the SAME set of CSS variable names; only the values
 * differ, so components never need to know which skin is active.
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

/* ==========================================================================
   SKIN SYSTEM — trục phong cách, độc lập với sáng/tối
   --------------------------------------------------------------------------
   'toolio' (mặc định) : điềm tĩnh, kỹ thuật  — navy lạnh + cyan/emerald
   'chotto'            : trẻ trung, gần gũi   — mực tím ấm + violet/mint/vàng

   Hai skin dùng CHUNG bộ tên biến CSS, chỉ khác giá trị. Skin được ghi lên
   <html data-skin="..."> và tổ hợp tự do với data-theme="light|dark".
   ========================================================================== */

export const SKIN_STORAGE_KEY = 'ai_tools_skin';

export const SKINS = Object.freeze({
  TOOLIO: 'toolio',
  CHOTTO: 'chotto',
});

export const DEFAULT_SKIN = SKINS.TOOLIO;

const VALID_SKINS = [SKINS.TOOLIO, SKINS.CHOTTO];

/**
 * Get stored skin preference from storage (defaults to window.localStorage).
 * @param {Storage} [storage]
 * @returns {'toolio' | 'chotto'}
 */
export function getStoredSkin(storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return DEFAULT_SKIN;
    const value = s.getItem(SKIN_STORAGE_KEY);
    return VALID_SKINS.includes(value) ? value : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

/**
 * Save skin preference to storage.
 * @param {'toolio' | 'chotto'} skin
 * @param {Storage} [storage]
 */
export function setStoredSkin(skin, storage) {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return;
    s.setItem(SKIN_STORAGE_KEY, VALID_SKINS.includes(skin) ? skin : DEFAULT_SKIN);
  } catch {
    // Gracefully handle storage errors (e.g., privacy mode quota)
  }
}

/**
 * Apply skin to document root. Does not touch data-theme.
 * @param {'toolio' | 'chotto'} skin
 * @param {Document} [doc]
 */
export function applySkinToDom(skin, doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.documentElement) return;
  d.documentElement.setAttribute('data-skin', VALID_SKINS.includes(skin) ? skin : DEFAULT_SKIN);
}

/**
 * High-level: persist skin preference and apply it to the DOM.
 * @param {'toolio' | 'chotto'} skin
 * @param {{ storage?: Storage, doc?: Document }} [options]
 * @returns {{ skin: string }}
 */
export function applySkin(skin, options = {}) {
  const validSkin = VALID_SKINS.includes(skin) ? skin : DEFAULT_SKIN;
  setStoredSkin(validSkin, options.storage);
  applySkinToDom(validSkin, options.doc);
  return { skin: validSkin };
}

/**
 * Initialize skin on startup.
 * @param {{ storage?: Storage, doc?: Document }} [options]
 * @returns {{ skin: string }}
 */
export function initSkin(options = {}) {
  const skin = getStoredSkin(options.storage);
  applySkinToDom(skin, options.doc);
  return { skin };
}

/**
 * Subscribe to cross-tab skin changes.
 * @param {(state: { skin: string }) => void} callback
 * @param {{ storage?: Storage, doc?: Document, win?: Window }} [options]
 * @returns {() => void} Unsubscribe function
 */
export function subscribeSkin(callback, options = {}) {
  const w = options.win || (typeof window !== 'undefined' ? window : null);
  if (!w) return () => {};

  const handleStorageChange = (e) => {
    if (e.key === SKIN_STORAGE_KEY) {
      const skin = getStoredSkin(options.storage);
      applySkinToDom(skin, options.doc);
      callback({ skin });
    }
  };

  w.addEventListener('storage', handleStorageChange);
  return () => w.removeEventListener('storage', handleStorageChange);
}
