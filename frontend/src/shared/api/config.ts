/**
 * API Configuration — Single Source of Truth
 *
 * عند النشر (Deployment) غيّر فقط VITE_API_BASE_URL في ملف .env
 * جميع الطلبات تمر من هنا — لا حاجة للبحث في باقي الملفات
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

/** Request timeout in milliseconds */
export const API_TIMEOUT = 15_000;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
} as const;
