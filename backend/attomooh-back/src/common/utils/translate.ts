/**
 * Translation Utility — Auto-translate Arabic → English
 *
 * يستخدم Google Translate API المجّاني لترجمة النصوص العربية تلقائياً إلى الإنجليزية.
 * في حال فشل الترجمة، يتم استخدام النص العربي كنص احتياطي.
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('TranslationUtil');

/**
 * Translates Arabic text to English using free Google Translate endpoint.
 * Falls back to original text on failure.
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text?.trim()) return text ?? '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);

    if (!res.ok) {
      logger.warn(`Translation HTTP error: ${res.status}`);
      return text;
    }

    const data = (await res.json()) as Array<Array<[string, string]>>;
    const translated = data[0]
      .map((segment) => segment[0])
      .join('');

    return translated || text;
  } catch (err) {
    logger.warn(
      `Translation failed for "${text.substring(0, 30)}...": ${(err as Error).message}`,
    );
    return text;
  }
}

/**
 * Creates a bilingual object { ar, en } from Arabic text.
 * Auto-translates the English version.
 */
export async function makeBilingual(
  arText: string,
): Promise<{ ar: string; en: string }> {
  const en = await translateToEnglish(arText);
  return { ar: arText, en };
}
