"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLocale,
  languageStorageKey,
  locales,
  type Locale,
  translate,
} from "@/lib/i18n";

type MessageParams = Record<string, string | number>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: MessageParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return defaultLocale;
    const stored = window.localStorage.getItem(languageStorageKey);
    return stored && locales.includes(stored as Locale)
      ? (stored as Locale)
      : defaultLocale;
  });

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "en" ? "sk" : "en"));
  }, []);

  const t = useCallback(
    (key: string, params?: MessageParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
