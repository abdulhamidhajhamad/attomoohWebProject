import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  translateToEnglish,
  getCachedTranslation,
} from '../lib/translationService';

/**
 * Returns the localized value based on the current language.
 * When language is English and the value is a string with Arabic text:
 *   - Checks built-in dictionary first (instant)
 *   - Falls back to cached translation
 *   - Kicks off async Google Translate if needed
 */
export function useLocalizedValue<T>(value: { ar: T; en: T }): T {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  // Check if ar === en AND the text is Arabic (backend didn't provide English)
  const needsTranslation = useMemo(
    () =>
      isEnglish &&
      typeof value.ar === 'string' &&
      typeof value.en === 'string' &&
      value.ar === value.en &&
      /[\u0600-\u06FF]/.test(value.ar as string),
    [isEnglish, value.ar, value.en],
  );

  const arText = (value.ar as unknown as string) || '';

  // Try synchronous lookup (dictionary + cache) — works on first render
  const instantResult = useMemo(
    () => (needsTranslation ? getCachedTranslation(arText) : null),
    [needsTranslation, arText],
  );

  const [translated, setTranslated] = useState<string | null>(instantResult);

  // Keep translated in sync when instantResult changes
  useEffect(() => {
    if (instantResult) {
      setTranslated(instantResult);
    }
  }, [instantResult]);

  useEffect(() => {
    if (!needsTranslation) {
      setTranslated(null);
      return;
    }

    // Already have an instant result (from dictionary/cache)
    if (instantResult) {
      setTranslated(instantResult);
      return;
    }

    // Async fallback — Google Translate API
    let cancelled = false;
    translateToEnglish(arText).then((result) => {
      if (!cancelled) {
        setTranslated(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [needsTranslation, arText, instantResult]);

  // Return translated if available
  if (needsTranslation && translated) {
    return translated as unknown as T;
  }

  // Default behavior
  return isEnglish ? value.en : value.ar;
}
