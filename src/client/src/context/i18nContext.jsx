import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const languagesList = [
  'zh-TW', 'zh-CN', 'en', 'es', 'pt', 'de', 'fr', 'ja', 'ko',
  'ru', 'it', 'nl', 'pl', 'tr', 'id'
];

const languageNames = {
  'zh-TW': '繁體中文', 'zh-CN': '简体中文', 'en': 'English', 'es': 'Español',
  'pt': 'Português', 'de': 'Deutsch', 'fr': 'Français', 'ja': '日本語',
  'ko': '한국어', 'ru': 'Русский', 'it': 'Italiano', 'nl': 'Nederlands',
  'pl': 'Polski', 'tr': 'Türkçe', 'id': 'Bahasa Indonesia'
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  const languages = languagesList.map(code => ({ code, name: languageNames[code] }));

  const fetchLanguageSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.language && languagesList.includes(data.language)) {
          setLanguageState(data.language);
          return data.language;
        }
      }
    } catch (error) {
      console.error('Failed to fetch language settings:', error);
    }
    return 'en';
  };

  const loadTranslations = useCallback(async (langCode) => {
    try {
      const response = await fetch(`/locales/${langCode}.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
      } else {
        // Fallback to English if translation not found
        const fallbackResponse = await fetch(`/locales/en.json`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setTranslations(fallbackData);
        } else {
          setTranslations({});
        }
      }
    } catch (error) {
      console.error(`Failed to load translations for ${langCode}:`, error);
      // Fallback to English
      try {
        const fallbackResponse = await fetch(`/locales/en.json`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setTranslations(fallbackData);
        } else {
          setTranslations({});
        }
      } catch (fallbackError) {
        setTranslations({});
      }
    }
  }, []);

  useEffect(() => {
    const initLanguage = async () => {
      setLoading(true);
      const lang = await fetchLanguageSettings();
      await loadTranslations(lang);
      setLoading(false);
    };

    initLanguage();
  }, [loadTranslations]);

  const setLanguage = async (langCode) => {
    if (!languagesList.includes(langCode)) return;

    setLanguageState(langCode);
    await loadTranslations(langCode);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: langCode })
      });
    } catch (error) {
      console.error('Failed to update language settings:', error);
    }
  };

  const t = (key) => {
    if (!key) return '';
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  if (loading) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, languages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};