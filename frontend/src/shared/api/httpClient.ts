/**
 * HTTP Client — Fetch wrapper with interceptors
 *
 * - يضيف JWT Token تلقائياً للطلبات المحمية
 * - يفك غلاف TransformInterceptor تاع الباك اند ويرجع data مباشرة
 * - يتعامل مع الأخطاء بشكل موحد
 * - يدعم timeout للطلبات
 * - يدعم FormData (multipart) و JSON
 * - يدعم request deduplication للطلبات GET المتزامنة
 */

import { API_CONFIG } from './config';

/* ═══════════════════════════════════
   Request Deduplication (for GET requests)
   ═══════════════════════════════════ */

const inFlightRequests = new Map<string, Promise<unknown>>();

function getDedupeKey(endpoint: string, options: RequestInit, requiresAuth: boolean): string {
  return `${options.method || 'GET'}:${endpoint}:${requiresAuth ? 'auth' : 'public'}`;
}

function withDeduplication<T>(
  key: string,
  factory: () => Promise<T>,
  method: string,
): Promise<T> {
  if (method === 'GET') {
    const existing = inFlightRequests.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }
    const promise = factory().catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });
    inFlightRequests.set(key, promise);
    promise.finally(() => inFlightRequests.delete(key));
    return promise;
  }
  return factory();
}

/* ═══════════════════════════════════
   Custom Error Class
   ═══════════════════════════════════ */

export class ApiError extends Error {
  readonly statusCode: number;
  readonly path?: string;

  constructor(statusCode: number, message: string, path?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.path = path;
  }
}

/* ═══════════════════════════════════
   Token Management (localStorage)
   ═══════════════════════════════════ */

const TOKEN_KEY = 'attomooh-token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/* ── Technician Token (separate from admin) ── */

export const TECH_TOKEN_KEY = 'attomooh-tech-token';

export function getStoredTechToken(): string | null {
  try {
    return localStorage.getItem(TECH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredTechToken(token: string): void {
  localStorage.setItem(TECH_TOKEN_KEY, token);
}

export function removeStoredTechToken(): void {
  localStorage.removeItem(TECH_TOKEN_KEY);
}

/* ═══════════════════════════════════
   Response Types (Backend wrapper)
   ═══════════════════════════════════ */

/** Success response from TransformInterceptor */
interface ApiSuccessResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/** Error response from AllExceptionsFilter */
interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}

/* ═══════════════════════════════════
   Core Request Function
   ═══════════════════════════════════ */

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false,
  tokenKey?: string,
  externalSignal?: AbortSignal,
): Promise<T> {
  const method = options.method || 'GET';
  const dedupeKey = getDedupeKey(endpoint, options, requiresAuth);

  return withDeduplication<T>(dedupeKey, async () => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    // ── Build headers ──
    const headers: Record<string, string> = {};

    // Don't set Content-Type for FormData — browser sets it with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add JWT token for protected routes
    if (requiresAuth) {
      const token = tokenKey
        ? localStorage.getItem(tokenKey)
        : getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // ── Timeout via AbortController ──
    const controller = new AbortController();
    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, API_CONFIG.timeout);

    // ── Handle external abort signal (component unmount, HMR, etc.) ──
    const abortHandler = () => {
      inFlightRequests.delete(dedupeKey);
      controller.abort();
    };
    if (externalSignal) {
      if (externalSignal.aborted) {
        inFlightRequests.delete(dedupeKey);
        throw new DOMException('signal is aborted without reason', 'AbortError');
      }
      externalSignal.addEventListener('abort', abortHandler);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortHandler);
      }

      // ── Handle HTTP errors ──
      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => null)) as ApiErrorResponse | null;

        const message = errorBody?.message
          ? Array.isArray(errorBody.message)
            ? errorBody.message.join(', ')
            : errorBody.message
          : `HTTP Error ${response.status}`;

        throw new ApiError(response.status, message, errorBody?.path);
      }

      // ── Unwrap TransformInterceptor response → return data directly ──
      const body = (await response.json()) as ApiSuccessResponse<T>;
      return body.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortHandler);
      }

      if (error instanceof ApiError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        // timeout (15s без ответа) → 408 error → يظهر للمستخدم
        if (isTimeout) {
          throw new ApiError(408, 'انتهت مهلة الطلب — حاول مرة أخرى');
        }
        // external abort (unmount/HMR/رفresh) → re-throw as-is → hooks تتعامل معه
        throw error;
      }

      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'خطأ في الشبكة',
      );
    }
  }, method);
}

/* ═══════════════════════════════════
   Public HTTP Methods
   ═══════════════════════════════════ */

export const httpClient = {
  /** GET request */
  get: <T>(endpoint: string, requiresAuth = false, tokenKey?: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'GET' }, requiresAuth, tokenKey, signal),

  /** POST request — supports JSON body and FormData */
  post: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
      signal,
    ),

  /** PATCH request — supports JSON body and FormData */
  patch: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
      signal,
    ),

  /** PUT request — supports JSON body and FormData */
  put: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
      signal,
    ),

  /** DELETE request */
  delete: <T>(endpoint: string, requiresAuth = false, tokenKey?: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'DELETE' }, requiresAuth, tokenKey, signal),
} as const;
