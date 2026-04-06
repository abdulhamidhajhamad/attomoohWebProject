import { create } from 'zustand';
import {
  technicianTasksService,
  type UnifiedTask,
  type TaskType,
  type TaskReportPayload,
} from '../api/services/technicianTasks.service';

/**
 * ===== Technician Tasks Store =====
 * مخزن مهام الفني — يستخدمه الفني لإدارة مهام الآلات (فحص/صيانة/تنصيب/إنتاج)
 */

interface TechnicianTasksStore {
  // ── State ──
  tasks: UnifiedTask[];
  loading: boolean;
  error: string | null;
  activeTaskId: string | null;

  // ── Actions ──
  fetchMyTasks: () => Promise<void>;
  startTask: (type: TaskType, id: string) => Promise<void>;
  pauseTask: (type: TaskType, id: string, reason?: string) => Promise<void>;
  resumeTask: (type: TaskType, id: string) => Promise<void>;
  finishTask: (type: TaskType, id: string, report?: TaskReportPayload) => Promise<void>;
  rejectTask: (type: TaskType, id: string, reason: string) => Promise<void>;
  clearError: () => void;
}

/** Extract message from unknown error */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export const useTechnicianTasksStore = create<TechnicianTasksStore>()((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  activeTaskId: null,

  fetchMyTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await technicianTasksService.getMyTasks();
      // حدد المهمة النشطة (في حالة in_progress أو in_maintenance)
      const activeTask = tasks.find((t) =>
        ['in_progress', 'in_maintenance'].includes(t.status)
      );
      set({ tasks, loading: false, activeTaskId: activeTask?._id || null });
    } catch (e: unknown) {
      console.error('[TechnicianTasksStore] fetchMyTasks error:', e);
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  startTask: async (type: TaskType, id: string) => {
    set({ error: null });
    try {
      await technicianTasksService.startTask(type, id);
      // أعد جلب المهام للحصول على الحالة المحدثة
      await get().fetchMyTasks();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  pauseTask: async (type: TaskType, id: string, reason?: string) => {
    set({ error: null });
    try {
      await technicianTasksService.pauseTask(type, id, reason);
      // أعد جلب المهام للحصول على الحالة المحدثة
      await get().fetchMyTasks();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  resumeTask: async (type: TaskType, id: string) => {
    set({ error: null });
    try {
      await technicianTasksService.resumeTask(type, id);
      await get().fetchMyTasks();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  finishTask: async (type: TaskType, id: string, report?: TaskReportPayload) => {
    set({ error: null });
    try {
      await technicianTasksService.finishTask(type, id, report);
      await get().fetchMyTasks();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  rejectTask: async (type: TaskType, id: string, reason: string) => {
    set({ error: null });
    try {
      await technicianTasksService.rejectTask(type, id, reason);
      // حذف المهمة من القائمة بعد الرفض
      set((s) => ({
        tasks: s.tasks.filter((t) => t._id !== id),
        activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
      }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
