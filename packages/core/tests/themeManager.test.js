import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THEME_STORAGE_KEY,
  THEMES,
  getStoredThemePreference,
  setStoredThemePreference,
  getSystemTheme,
  resolveTheme,
  applyThemeToDom,
  applyTheme,
  initTheme,
  subscribeTheme,
} from '../src/theme/themeManager.js';

function createMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

function createMockDocument() {
  const classes = new Set();
  const attributes = new Map();
  return {
    documentElement: {
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
      setAttribute: (k, v) => attributes.set(k, v),
      getAttribute: (k) => attributes.get(k),
      style: {},
    },
    _classes: classes,
    _attributes: attributes,
  };
}

function createMockWindow(isDark = true) {
  const listeners = new Map();
  const mediaListeners = new Set();

  return {
    matchMedia: (query) => ({
      matches: isDark,
      media: query,
      addEventListener: (type, cb) => mediaListeners.add(cb),
      removeEventListener: (type, cb) => mediaListeners.delete(cb),
    }),
    addEventListener: (type, cb) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(cb);
    },
    removeEventListener: (type, cb) => {
      if (listeners.has(type)) listeners.get(type).delete(cb);
    },
    _triggerStorage: (e) => {
      const cbs = listeners.get('storage') || [];
      for (const cb of cbs) cb(e);
    },
    _triggerMediaChange: () => {
      for (const cb of mediaListeners) cb();
    },
  };
}

test('THEMES contains light, dark, and system', () => {
  assert.equal(THEMES.LIGHT, 'light');
  assert.equal(THEMES.DARK, 'dark');
  assert.equal(THEMES.SYSTEM, 'system');
  assert.equal(THEME_STORAGE_KEY, 'ai_tools_theme');
});

test('getStoredThemePreference returns "system" by default or if invalid', () => {
  const emptyStorage = createMockStorage();
  assert.equal(getStoredThemePreference(emptyStorage), 'system');

  const invalidStorage = createMockStorage({ [THEME_STORAGE_KEY]: 'neon-blue' });
  assert.equal(getStoredThemePreference(invalidStorage), 'system');

  const validStorage = createMockStorage({ [THEME_STORAGE_KEY]: 'dark' });
  assert.equal(getStoredThemePreference(validStorage), 'dark');

  const lightStorage = createMockStorage({ [THEME_STORAGE_KEY]: 'light' });
  assert.equal(getStoredThemePreference(lightStorage), 'light');
});

test('setStoredThemePreference updates storage safely', () => {
  const storage = createMockStorage();
  setStoredThemePreference('light', storage);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'light');

  setStoredThemePreference('invalid-mode', storage);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'system');
});

test('resolveTheme resolves system scheme or returns explicit preference', () => {
  const mockWinDark = createMockWindow(true);
  const mockWinLight = createMockWindow(false);

  assert.equal(resolveTheme('light', mockWinDark), 'light');
  assert.equal(resolveTheme('dark', mockWinLight), 'dark');
  assert.equal(resolveTheme('system', mockWinDark), 'dark');
  assert.equal(resolveTheme('system', mockWinLight), 'light');
});

test('applyThemeToDom sets data-theme, class, and colorScheme', () => {
  const doc = createMockDocument();

  applyThemeToDom('light', doc);
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(doc.documentElement.classList.contains('light'), true);
  assert.equal(doc.documentElement.classList.contains('dark'), false);
  assert.equal(doc.documentElement.style.colorScheme, 'light');

  applyThemeToDom('dark', doc);
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(doc.documentElement.classList.contains('dark'), true);
  assert.equal(doc.documentElement.classList.contains('light'), false);
  assert.equal(doc.documentElement.style.colorScheme, 'dark');
});

test('applyTheme coordinates storage, resolution, and DOM update', () => {
  const storage = createMockStorage();
  const doc = createMockDocument();
  const win = createMockWindow(true);

  const res = applyTheme('light', { storage, doc, win });
  assert.equal(res.preference, 'light');
  assert.equal(res.resolvedTheme, 'light');
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'light');
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');
});

test('initTheme reads storage and synchronizes DOM on boot', () => {
  const storage = createMockStorage({ [THEME_STORAGE_KEY]: 'dark' });
  const doc = createMockDocument();
  const win = createMockWindow(false);

  const res = initTheme({ storage, doc, win });
  assert.equal(res.preference, 'dark');
  assert.equal(res.resolvedTheme, 'dark');
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark');
});

test('subscribeTheme reacts to cross-tab storage changes', () => {
  const storage = createMockStorage({ [THEME_STORAGE_KEY]: 'dark' });
  const doc = createMockDocument();
  const win = createMockWindow(true);

  let notified = null;
  const unsubscribe = subscribeTheme((state) => {
    notified = state;
  }, { storage, doc, win });

  storage.setItem(THEME_STORAGE_KEY, 'light');
  win._triggerStorage({ key: THEME_STORAGE_KEY, newValue: 'light' });

  assert.deepEqual(notified, { preference: 'light', resolvedTheme: 'light' });
  assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');

  unsubscribe();
});
