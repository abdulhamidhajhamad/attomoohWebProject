/**
 * API Configuration — Single Source of Truth
 *
 * عند النشر (Deployment) غيّر فقط VITE_API_BASE_URL في ملف .env
 * جميع الطلبات تمر من هنا — لا حاجة للبحث في باقي الملفات
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '';

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn(
    '[API Config] VITE_API_BASE_URL is not set. ' +
    'API calls will be relative to the same origin (breaks if backend is elsewhere).'
  );
}

/** Request timeout in milliseconds — 30s to accommodate Render cold starts */
export const API_TIMEOUT = 30_000;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
} as const;
