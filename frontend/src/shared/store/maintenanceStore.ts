import { create } from 'zustand';
import { maintenanceService } from '../api/services';
import type {
  ApiMaintenanceTask,
  ApiMaintenanceStats,
  ApiTechnician,
  ApiTechnicianStatus,
  CreateTaskRequest,
  AssignTaskRequest,
  TaskReportRequest,
  UpdateTaskRequest,
} from '../api/types';

/**
 * ===== Maintenance Store =====
 * إدارة مهام الصيانة — يستخدمه الأدمن والفني
 */

interface MaintenanceStore {
  // ── State ──
  tasks: ApiMaintenanceTask[];
  calendarTasks: ApiMaintenanceTask[];
  myTasks: ApiMaintenanceTask[];
  technicians: ApiTechnician[];
  stats: ApiMaintenanceStats | null;
  myStatus: ApiTechnicianStatus | null;
  loading: boolean;
  error: string | null;

  // ── Admin Actions ──
  fetchAllTasks: (status?: string) => Promise<void>;
  fetchCalendarTasks: (from: string, to: string, technicianId?: string, tokenKey?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchTechnicians: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<ApiMaintenanceTask>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<void>;
  assignTask: (id: string, data: AssignTaskRequest) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // ── Technician Actions ──
  fetchMyTasks: () => Promise<void>;
  fetchMyStatus: () => Promise<void>;
  updateMyStatus: (status: ApiTechnicianStatus) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  finishTask: (id: string, report: TaskReportRequest) => Promise<void>;

  // ── Shared ──
  fetchTaskById: (id: string) => Promise<ApiMaintenanceTask>;
  clearError: () => void;
}

/** Extract message from unknown error */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Replace or append a task in a list */
function upsertTask(
  list: ApiMaintenanceTask[],
  updated: ApiMaintenanceTask,
): ApiMaintenanceTask[] {
  const idx = list.findIndex((t) => t._id === updated._id);
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = updated;
    return copy;
  }
  return [updated, ...list];
}

export const useMaintenanceStore = create<MaintenanceStore>()((set) => ({
  tasks: [],
  calendarTasks: [],
  myTasks: [],
  technicians: [],
  stats: null,
  myStatus: null,
  loading: false,
  error: null,

  /* ═══════════════════════════════════
     Admin Actions
     ═══════════════════════════════════ */

  fetchAllTasks: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const tasks = await maintenanceService.getAllTasks(status);
      set({ tasks, loading: false });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  fetchCalendarTasks: async (from: string, to: string, technicianId?: string, tokenKey?: string) => {
    set({ loading: true, error: null });
    try {
      const calendarTasks = await maintenanceService.getCalendarTasks(from, to, technicianId, tokenKey);
      set({ calendarTasks, loading: false });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await maintenanceService.getStats();
      set({ stats });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
    }
  },

  fetchTechnicians: async () => {
    try {
      const technicians = await maintenanceService.getTechnicians();
      set({ technicians });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
    }
  },

  createTask: async (data: CreateTaskRequest) => {
    set({ loading: true, error: null });
    try {
      const task = await maintenanceService.createTask(data);
      set((s) => ({ tasks: [task, ...s.tasks], loading: false }));
      return task;
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), loading: false });
      throw e;
    }
  },

  updateTask: async (id: string, data: UpdateTaskRequest) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.updateTask(id, data);
      set((s) => ({ tasks: upsertTask(s.tasks, updated) }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  assignTask: async (id: string, data: AssignTaskRequest) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.assignTask(id, data);
      set((s) => ({ tasks: upsertTask(s.tasks, updated) }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  cancelTask: async (id: string) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.cancelTask(id);
      set((s) => ({ tasks: upsertTask(s.tasks, updated) }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null });
    try {
      await maintenanceService.deleteTask(id);
      set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Technician Actions
     ═══════════════════════════════════ */

  fetchMyTasks: async () => {
    set({ loading: true, error: null });
    try {
      const myTasks = await maintenanceService.getMyTasks();
      set({ myTasks, loading: false });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  fetchMyStatus: async () => {
    try {
      const res = await maintenanceService.getMyStatus();
      set({ myStatus: res.technicianStatus });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
    }
  },

  updateMyStatus: async (status: ApiTechnicianStatus) => {
    set({ error: null });
    try {
      const res = await maintenanceService.updateMyStatus(status);
      set({ myStatus: res.technicianStatus });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  startTask: async (id: string) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.startTask(id);
      set((s) => ({
        myTasks: upsertTask(s.myTasks, updated),
        tasks: upsertTask(s.tasks, updated),
      }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  pauseTask: async (id: string) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.pauseTask(id);
      set((s) => ({
        myTasks: upsertTask(s.myTasks, updated),
        tasks: upsertTask(s.tasks, updated),
      }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  resumeTask: async (id: string) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.resumeTask(id);
      set((s) => ({
        myTasks: upsertTask(s.myTasks, updated),
        tasks: upsertTask(s.tasks, updated),
      }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  finishTask: async (id: string, report: TaskReportRequest) => {
    set({ error: null });
    try {
      const updated = await maintenanceService.finishTask(id, report);
      set((s) => ({
        myTasks: upsertTask(s.myTasks, updated),
        tasks: upsertTask(s.tasks, updated),
      }));
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Shared
     ═══════════════════════════════════ */

  fetchTaskById: async (id: string) => {
    try {
      return await maintenanceService.getTaskById(id);
    } catch (e: unknown) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
