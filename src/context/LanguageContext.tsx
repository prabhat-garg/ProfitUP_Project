import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../lib/types';
import { readLanguage, writeLanguage } from '../lib/storage';

interface LanguageContextValue {
  lang: Lang;
  setLanguage: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Lang>(() => (readLanguage() as Lang) || 'hi');

  useEffect(() => {
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.documentElement.dataset.lang = lang;
    writeLanguage(lang);
  }, [lang, i18n]);

  const value = useMemo(
    () => ({
      lang,
      setLanguage: (next: Lang) => {
        setLang(next);
        void i18n.changeLanguage(next);
      },
    }),
    [lang, i18n],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
