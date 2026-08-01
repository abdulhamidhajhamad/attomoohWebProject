/**
 * Auth Service — Authentication API calls
 *
 * POST /auth/login   → تسجيل الدخول
 * POST /auth/signup  → تسجيل مستخدم جديد
 */

import { httpClient, setStoredToken, removeStoredToken } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { LoginRequest, SignupRequest, AuthResponse } from '../types';

export const authService = {
  /**
   * POST /auth/login
   * Authenticates admin and stores JWT token
   * Returns the access token and the DB-verified role.
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await httpClient.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    setStoredToken(data.accessToken);
    return data;
  },

  /**
   * POST /auth/signup
   * Registers a new user and stores JWT token
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const data = await httpClient.post<AuthResponse>(
      ENDPOINTS.AUTH.SIGNUP,
      userData,
    );
    setStoredToken(data.accessToken);
    return data;
  },

  /** Removes stored token and ends session */
  logout(): void {
    removeStoredToken();
  },
} as const;
