import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  httpClient,
  setStoredTechToken,
  removeStoredTechToken,
  getStoredTechToken,
} from '../api/httpClient';
import { ENDPOINTS } from '../api/endpoints';
import type { AuthResponse } from '../api/types';

/**
 * ===== Technician Auth Store =====
 * مخزن مصادقة الفنيين — منفصل عن مخزن الأدمن
 * يحفظ توكن الفني في localStorage بمفتاح مختلف عن الأدمن
 * هيك ما بتضارب الجلسات لو فتحت الأدمن والفني بنفس المتصفح
 */

interface TechnicianAuthStore {
  isAuthenticated: boolean;
  techEmail: string | null;
  loginTime: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
}

// مدة الجلسة: 24 ساعة
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const useTechnicianAuthStore = create<TechnicianAuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      techEmail: null,
      loginTime: null,

      login: async (email: string, password: string): Promise<boolean> => {
        try {
          const data = await httpClient.post<AuthResponse>(
            ENDPOINTS.AUTH.LOGIN,
            { email, password },
          );
          setStoredTechToken(data.accessToken);
          set({
            isAuthenticated: true,
            techEmail: email,
            loginTime: Date.now(),
          });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        removeStoredTechToken();
        set({
          isAuthenticated: false,
          techEmail: null,
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
        const token = getStoredTechToken();
        if (!token) {
          get().logout();
          return false;
        }

        return true;
      },
    }),
    { name: 'attomooh-technician' },
  ),
);
