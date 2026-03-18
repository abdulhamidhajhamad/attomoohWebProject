import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/services';
import { getStoredToken } from '../api/httpClient';

/**
 * ===== Admin Auth Store =====
 * يستخدم JWT Token من الباك اند للمصادقة
 * POST /auth/login → يرجع accessToken → يتخزن في localStorage
 * كل طلب محمي بياخذ التوكن تلقائياً من httpClient
 */

interface AdminStore {
  isAuthenticated: boolean;
  adminEmail: string | null;
  loginTime: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
}

// مدة الجلسة: 24 ساعة
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      adminEmail: null,
      loginTime: null,

      login: async (email: string, password: string): Promise<boolean> => {
        try {
          await authService.login({ email, password });
          set({
            isAuthenticated: true,
            adminEmail: email,
            loginTime: Date.now(),
          });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        authService.logout();
        set({
          isAuthenticated: false,
          adminEmail: null,
          loginTime: null,
        });
      },

      checkSession: (): boolean => {
        const { isAuthenticated, loginTime } = get();
        if (!isAuthenticated || !loginTime) return false;

        // Check session expiry
        if (Date.now() - loginTime > SESSION_DURATION) {
          get().logout();
          return false;
        }

        // Check token exists
        const token = getStoredToken();
        if (!token) {
          get().logout();
          return false;
        }

        return true;
      },
    }),
    { name: 'attomooh-admin' },
  ),
);
