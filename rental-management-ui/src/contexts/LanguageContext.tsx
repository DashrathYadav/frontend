import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'hi';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Check localStorage first, fallback to browser language or English
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang === 'en' || storedLang === 'hi') {
      return storedLang as Language;
    }
    return 'en';
  });

  const [isRTL] = useState(false); // Hindi is LTR, if you add RTL languages like Arabic, update this

  useEffect(() => {
    // Set the initial language
    i18n.changeLanguage(currentLanguage);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
