/**
 * HTTP Client — Fetch wrapper with interceptors
 *
 * - يضيف JWT Token تلقائياً للطلبات المحمية
 * - يفك غلاف TransformInterceptor تاع الباك اند ويرجع data مباشرة
 * - يتعامل مع الأخطاء بشكل موحد
 * - يدعم timeout للطلبات
 * - يدعم FormData (multipart) و JSON
 */

import { API_CONFIG } from './config';

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
): Promise<T> {
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
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'انتهت مهلة الطلب — حاول مرة أخرى');
    }

    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'خطأ في الشبكة',
    );
  }
}

/* ═══════════════════════════════════
   Public HTTP Methods
   ═══════════════════════════════════ */

export const httpClient = {
  /** GET request */
  get: <T>(endpoint: string, requiresAuth = false, tokenKey?: string) =>
    request<T>(endpoint, { method: 'GET' }, requiresAuth, tokenKey),

  /** POST request — supports JSON body and FormData */
  post: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string) =>
    request<T>(
      endpoint,
      {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
    ),

  /** PATCH request — supports JSON body and FormData */
  patch: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string) =>
    request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
    ),

  /** PUT request — supports JSON body and FormData */
  put: <T>(endpoint: string, body?: unknown, requiresAuth = false, tokenKey?: string) =>
    request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      requiresAuth,
      tokenKey,
    ),

  /** DELETE request */
  delete: <T>(endpoint: string, requiresAuth = false, tokenKey?: string) =>
    request<T>(endpoint, { method: 'DELETE' }, requiresAuth, tokenKey),
} as const;
