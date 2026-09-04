"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ja } from './ja.js';
import { vi } from './vi.js';
import { en } from './en.js';
const dictionaries = {
  ja,
  vi,
  en
};
const I18nContext = createContext(null);
function format(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
function I18nProvider({ children, forcedLang }) {
  const [language, setLanguageState] = useState(() => {
    if (forcedLang && ["ja", "vi", "en"].includes(forcedLang)) return forcedLang;
    try {
      const saved = localStorage.getItem("idphoto_lang") || localStorage.getItem("hub_lang");
      if (saved && ["ja", "vi", "en"].includes(saved)) return saved;
    } catch {}
    return "vi";
  });

  useEffect(() => {
    if (forcedLang && ["ja", "vi", "en"].includes(forcedLang)) {
      setLanguageState(forcedLang);
    }
  }, [forcedLang]);
  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("idphoto_lang", lang);
    } catch {
    }
  };
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: dictionaries[language] || ja,
      format
    }),
    [language]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: "ja",
      setLanguage: () => {
      },
      t: ja,
      format: (template, values) => {
        let res = template;
        for (const [k, v] of Object.entries(values)) {
          res = res.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
        return res;
      }
    };
  }
  return context;
}
export {
  I18nProvider,
  format,
  useTranslation
};
