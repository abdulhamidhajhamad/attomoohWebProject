import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    const lang = i18n.language;

    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body.style.fontFamily = "'Cairo', sans-serif";

    localStorage.setItem('lang', lang);
  }, [i18n.language]);

  const isRTL = i18n.language === 'ar';
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return { isRTL, currentLang, toggleLanguage };
}
