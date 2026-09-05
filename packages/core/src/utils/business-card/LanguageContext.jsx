import { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS } from "./translations.js";
const LanguageContext = createContext(void 0);
const STORAGE_KEY = "ai_tools_business_card_language";
export const LanguageProvider = ({ children, initialLang }) => {
  const [language, setLanguageState] = useState(() => {
    if (initialLang && ['vi', 'en', 'ja'].includes(initialLang)) return initialLang;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === "vi" || saved === "en" || saved === "ja")) {
        return saved;
      }
    } catch {
    }
    return "vi";
  });

  useEffect(() => {
    if (initialLang && ['vi', 'en', 'ja'].includes(initialLang)) {
      setLanguageState(initialLang);
    }
  }, [initialLang]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
    }
  };
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const t = (key) => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS["ja"];
    return currentDict[key] || TRANSLATIONS["ja"][key] || TRANSLATIONS["vi"][key] || key;
  };
  const value = {
    language,
    setLanguage,
    t,
    translations: TRANSLATIONS[language] || TRANSLATIONS["ja"]
  };
  return <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>;
};
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
