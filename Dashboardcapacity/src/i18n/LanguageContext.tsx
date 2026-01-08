import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';
import { translationsService } from '../services/translationsService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  reloadTranslations: () => Promise<void>;
  isLoadingTranslations: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'app_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'de') {
      return stored;
    }
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('de') ? 'de' : 'en';
  });

  // Start with static translations as fallback, then load from DB
  const [currentTranslations, setCurrentTranslations] = useState<TranslationKeys>(translations[language as keyof typeof translations]);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  // Load translations from database with fallback
  const loadTranslations = useCallback(async (lang: Language) => {
    setIsLoadingTranslations(true);
    try {
      const merged = await translationsService.getMergedTranslations(lang);
      setCurrentTranslations(merged);
    } catch (error) {
      console.warn('Failed to load translations from DB, using fallback:', error);
      setCurrentTranslations(translations[lang]);
    } finally {
      setIsLoadingTranslations(false);
    }
  }, []);

  // Reload translations (for use after CMS updates)
  const reloadTranslations = useCallback(async () => {
    await loadTranslations(language);
  }, [language, loadTranslations]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  // Load translations when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    loadTranslations(language);
  }, [language, loadTranslations]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: currentTranslations,
    reloadTranslations,
    isLoadingTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Shorthand hook for translations only
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
