/**
 * Translation Service — ترجمة تلقائية من عربي → إنجليزي
 *
 * ١. يبحث أولاً في القاموس المحلي (فوري، بدون إنترنت)
 * ٢. إذا مش موجود — يجرب Google Translate API
 * ٣. النتائج تتخزن في localStorage عشان ما يترجم نفس النص مرتين
 */

const CACHE_KEY = 'attomooh-translations';
const API_URL = 'https://translate.googleapis.com/translate_a/single';

/* ═══════════════════════════════════
   Built-in Arabic → English Dictionary
   قاموس مدمج لمصطلحات المعدات الشائعة
   ═══════════════════════════════════ */

const DICTIONARY: Record<string, string> = {
  // ── أفران وشوي ──
  'أفران': 'Ovens',
  'فرن': 'Oven',
  'أفران صناعية': 'Industrial Ovens',
  'فرن صناعي': 'Industrial Oven',
  'أفران غاز': 'Gas Ovens',
  'أفران كهرباء': 'Electric Ovens',
  'أفران بيتزا': 'Pizza Ovens',
  'فرن بيتزا': 'Pizza Oven',
  'أفران حجر': 'Stone Ovens',
  'أفران دوّارة': 'Rotary Ovens',
  'أفران كونفكشن': 'Convection Ovens',
  'شوايات': 'Grills',
  'شواية': 'Grill',
  'شوايات غاز': 'Gas Grills',
  'شوايات كهرباء': 'Electric Grills',
  'شوايات فحم': 'Charcoal Grills',
  'سخانات': 'Heaters',
  'سخان': 'Heater',
  'مايكرويف': 'Microwave',
  'مايكرويف صناعي': 'Commercial Microwave',

  // ── لحوم ومفارم ──
  'مفارم لحوم': 'Meat Grinders',
  'مفرمة لحوم': 'Meat Grinder',
  'مفارم لحمة': 'Meat Grinders',
  'مفرمة لحمة': 'Meat Grinder',
  'مفرمة': 'Grinder',
  'مفارم': 'Grinders',
  'لحوم': 'Meat',
  'قطاعات': 'Cutters',
  'قطاعة': 'Cutter',
  'مناشير لحوم': 'Meat Saws',
  'منشار لحوم': 'Meat Saw',
  'منشار': 'Saw',

  // ── تبريد وتجميد ──
  'ثلاجات': 'Refrigerators',
  'ثلاجة': 'Refrigerator',
  'ثلاجات عرض': 'Display Refrigerators',
  'ثلاجة عرض': 'Display Refrigerator',
  'فريزر': 'Freezer',
  'فريزرات': 'Freezers',
  'تبريد': 'Refrigeration',
  'تبريد وتجميد': 'Refrigeration & Freezing',
  'تجميد': 'Freezing',
  'برادات': 'Coolers',
  'برادة': 'Cooler',
  'برادة مياه': 'Water Cooler',

  // ── ماكينات مشروبات ──
  'اسبريسو': 'Espresso Machines',
  'إسبريسو': 'Espresso Machines',
  'ماكينة إسبريسو': 'Espresso Machine',
  'ماكينة اسبريسو': 'Espresso Machine',
  'ماكينات إسبريسو': 'Espresso Machines',
  'ماكينات اسبريسو': 'Espresso Machines',
  'ماكينات قهوة': 'Coffee Machines',
  'ماكينة قهوة': 'Coffee Machine',
  'قهوة': 'Coffee',
  'ماكينات عصير': 'Juice Machines',
  'عصارة': 'Juicer',
  'عصارات': 'Juicers',
  'خلاطات': 'Blenders',
  'خلاط': 'Blender',
  'خلاطات صناعية': 'Industrial Blenders',

  // ── معجنات ──
  'عجانات': 'Dough Mixers',
  'عجانة': 'Dough Mixer',
  'معجنات': 'Pastry Equipment',
  'رقاقات عجين': 'Dough Sheeters',
  'رقاقة عجين': 'Dough Sheeter',
  'فرد عجين': 'Dough Roller',

  // ── طبخ وتحضير ──
  'قلايات': 'Fryers',
  'قلاية': 'Fryer',
  'قلايات صناعية': 'Commercial Fryers',
  'قلاية صناعية': 'Commercial Fryer',
  'قلايات غاز': 'Gas Fryers',
  'قلايات كهرباء': 'Electric Fryers',
  'طباخات': 'Cookers',
  'طباخ': 'Cooker',
  'بين ماري': 'Bain Marie',
  'باين ماري': 'Bain Marie',
  'أدوات تحضير': 'Preparation Tools',
  'تحضير': 'Preparation',

  // ── طاولات عمل ──
  'طاولات عمل': 'Work Tables',
  'طاولة عمل': 'Work Table',
  'طاولات ستانلس': 'Stainless Steel Tables',
  'طاولة ستانلس': 'Stainless Steel Table',
  'طاولات': 'Tables',
  'طاولة': 'Table',
  'ستانلس ستيل': 'Stainless Steel',
  'ستانلس': 'Stainless Steel',

  // ── شاورما ──
  'شاورما': 'Shawarma',
  'ماكينة شاورما': 'Shawarma Machine',
  'ماكينات شاورما': 'Shawarma Machines',
  'سيخ شاورما': 'Shawarma Spit',

  // ── وفل وكريب ──
  'وفل': 'Waffle',
  'كريب': 'Crepe',
  'وفل/كريب': 'Waffle / Crepe',
  'وفل / كريب': 'Waffle / Crepe',
  'ماكينة وفل': 'Waffle Maker',
  'ماكينة كريب': 'Crepe Maker',
  'وفل وكريب': 'Waffle & Crepe',

  // ── غسيل وتنظيف ──
  'غسالات صحون': 'Dishwashers',
  'غسالة صحون': 'Dishwasher',
  'غسالات': 'Washers',
  'غسالات صناعية': 'Industrial Washers',
  'معدات تنظيف': 'Cleaning Equipment',

  // ── تهوية ──
  'شفاطات': 'Exhaust Hoods',
  'شفاط': 'Exhaust Hood',
  'هود': 'Hood',
  'مراوح': 'Fans',
  'مروحة': 'Fan',
  'تهوية': 'Ventilation',
  'شفاطات مطابخ': 'Kitchen Hoods',

  // ── موازين ──
  'موازين': 'Scales',
  'ميزان': 'Scale',
  'موازين صناعية': 'Industrial Scales',
  'موازين رقمية': 'Digital Scales',

  // ── عامة ──
  'معدات ثقيلة': 'Heavy Equipment',
  'معدات مطابخ': 'Kitchen Equipment',
  'معدات مطاعم': 'Restaurant Equipment',
  'تجهيزات': 'Equipment',
  'تجهيزات مطابخ': 'Kitchen Equipment',
  'تجهيزات مطاعم': 'Restaurant Equipment',
  'ملاحم': 'Butcher Shops',
  'معدات ملاحم': 'Butcher Equipment',
  'صيانة': 'Maintenance',
  'صيانة وقطع غيار': 'Maintenance & Spare Parts',
  'قطع غيار': 'Spare Parts',
  'كهرباء': 'Electrical',
  'معدات كهربائية': 'Electrical Equipment',
  'تغليف': 'Packaging',
  'تغليف وتعبئة': 'Packaging & Filling',
  'نقل وتوصيل': 'Delivery & Shipping',
  'آيس كريم': 'Ice Cream',
  'ماكينة آيس كريم': 'Ice Cream Machine',
  'ماكينات آيس كريم': 'Ice Cream Machines',
  'سلايسر': 'Slicer',
  'شرائح': 'Slicer',
  'ماكينة تقطيع': 'Slicing Machine',
  'بوفيه': 'Buffet',
  'تسخين': 'Heating',
  'معدات بوفيه': 'Buffet Equipment',
  'حلويات': 'Desserts',
  'معدات حلويات': 'Dessert Equipment',
  'مشروبات': 'Beverages',
  'ماكينات مشروبات': 'Beverage Machines',
  'تقطيع': 'Cutting',
  'معدات تقطيع': 'Cutting Equipment',
  'فاكيوم': 'Vacuum',
  'ماكينة فاكيوم': 'Vacuum Machine',
  'تغليف فاكيوم': 'Vacuum Packaging',
  'ستيمر': 'Steamer',
  'بخار': 'Steam',
};

/**
 * Try to find a match in the dictionary.
 * Tries exact match first, then normalized (trimmed, no diacritics).
 */
function dictionaryLookup(text: string): string | null {
  const trimmed = text.trim();
  // Exact match
  if (DICTIONARY[trimmed]) return DICTIONARY[trimmed];
  // Try without diacritics (tashkeel)
  const clean = trimmed.replace(/[\u064B-\u065F\u0670]/g, '');
  if (DICTIONARY[clean]) return DICTIONARY[clean];
  // Try lowercase
  const lower = clean.toLowerCase();
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (key.replace(/[\u064B-\u065F\u0670]/g, '').toLowerCase() === lower) {
      return val;
    }
  }
  return null;
}

/* ═══════════════════════════════════
   In-memory + localStorage cache
   ═══════════════════════════════════ */

type TranslationCache = Record<string, string>;

function loadCache(): TranslationCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: TranslationCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full — silently ignore
  }
}

let memoryCache: TranslationCache = loadCache();
const pendingRequests = new Map<string, Promise<string>>();

/* ═══════════════════════════════════
   Core Translation Function
   ═══════════════════════════════════ */

/**
 * Translate Arabic text to English.
 * 1. Check local dictionary (instant)
 * 2. Check cache (instant)
 * 3. Call Google Translate API (async)
 * 4. Fallback to original text
 */
export async function translateToEnglish(arabicText: string): Promise<string> {
  if (!arabicText || !arabicText.trim()) return arabicText;
  if (!/[\u0600-\u06FF]/.test(arabicText)) return arabicText;

  const cacheKey = arabicText.trim();

  // 1. Dictionary lookup (instant)
  const dictResult = dictionaryLookup(cacheKey);
  if (dictResult) {
    memoryCache[cacheKey] = dictResult;
    return dictResult;
  }

  // 2. Memory cache
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  // 3. Pending request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 4. Google Translate API
  const request = fetchTranslation(cacheKey);
  pendingRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Get cached translation synchronously.
 * Checks dictionary first, then cache.
 */
export function getCachedTranslation(arabicText: string): string | null {
  if (!arabicText || !arabicText.trim()) return arabicText;
  if (!/[\u0600-\u06FF]/.test(arabicText)) return arabicText;

  const key = arabicText.trim();

  // Dictionary (always available)
  const dictResult = dictionaryLookup(key);
  if (dictResult) {
    memoryCache[key] = dictResult;
    return dictResult;
  }

  // Cache
  return memoryCache[key] || null;
}

/* ═══════════════════════════════════
   Google Translate API
   ═══════════════════════════════════ */

async function fetchTranslation(text: string): Promise<string> {
  try {
    const url = `${API_URL}?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error('API error');

    const data = await response.json();

    let translated = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      for (const segment of data[0]) {
        if (Array.isArray(segment) && segment[0]) {
          translated += segment[0];
        }
      }
    }

    if (translated && translated.trim()) {
      memoryCache[text] = translated.trim();
      saveCache(memoryCache);
      return translated.trim();
    }

    return text;
  } catch {
    return text;
  }
}

/* ═══════════════════════════════════
   Utilities
   ═══════════════════════════════════ */

export async function translateBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map(translateToEnglish));
}

export function clearTranslationCache(): void {
  memoryCache = {};
  localStorage.removeItem(CACHE_KEY);
}
