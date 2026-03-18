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
   */
  async login(credentials: LoginRequest): Promise<string> {
    const data = await httpClient.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    setStoredToken(data.accessToken);
    return data.accessToken;
  },

  /**
   * POST /auth/signup
   * Registers a new user and stores JWT token
   */
  async signup(userData: SignupRequest): Promise<string> {
    const data = await httpClient.post<AuthResponse>(
      ENDPOINTS.AUTH.SIGNUP,
      userData,
    );
    setStoredToken(data.accessToken);
    return data.accessToken;
  },

  /** Removes stored token and ends session */
  logout(): void {
    removeStoredToken();
  },
} as const;
