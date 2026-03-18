/**
 * Maintenance Service — Maintenance API calls
 *
 * Admin endpoints:
 *   POST   /maintenance/tasks          → إنشاء مهمة
 *   GET    /maintenance/tasks          → جلب جميع المهام
 *   GET    /maintenance/tasks/:id      → جلب مهمة واحدة
 *   PATCH  /maintenance/tasks/:id      → تحديث مهمة
 *   PATCH  /maintenance/tasks/:id/assign → تعيين فني
 *   PATCH  /maintenance/tasks/:id/cancel → إلغاء مهمة
 *   DELETE /maintenance/tasks/:id      → حذف مهمة
 *   GET    /maintenance/stats          → إحصائيات
 *   GET    /maintenance/technicians    → قائمة الفنيين
 *
 * Technician endpoints:
 *   GET    /maintenance/my-tasks       → مهامي
 *   GET    /maintenance/my-tasks/active → مهامي النشطة
 *   PATCH  /maintenance/tasks/:id/start  → بدء
 *   PATCH  /maintenance/tasks/:id/pause  → إيقاف مؤقت
 *   PATCH  /maintenance/tasks/:id/resume → استئناف
 *   PATCH  /maintenance/tasks/:id/finish → إنهاء مع تقرير
 */

import { httpClient, TECH_TOKEN_KEY } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiMaintenanceTask,
  ApiMaintenanceStats,
  ApiTechnician,
  ApiTechnicianStatus,
  CreateTaskRequest,
  AssignTaskRequest,
  TaskReportRequest,
  UpdateTaskRequest,
} from '../types';

export const maintenanceService = {
  /* ═══════════════════════════════════
     Admin Endpoints
     ═══════════════════════════════════ */

  /** GET /maintenance/tasks/calendar — Calendar view (Admin or Technician) */
  async getCalendarTasks(
    from: string,
    to: string,
    technicianId?: string,
    tokenKey?: string,
  ): Promise<ApiMaintenanceTask[]> {
    let url = `${ENDPOINTS.MAINTENANCE.CALENDAR}?from=${from}&to=${to}`;
    if (technicianId) url += `&technicianId=${technicianId}`;
    return httpClient.get<ApiMaintenanceTask[]>(url, true, tokenKey);
  },

  /** POST /maintenance/tasks — Admin only */
  async createTask(data: CreateTaskRequest): Promise<ApiMaintenanceTask> {
    return httpClient.post<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.TASKS,
      data,
      true,
    );
  },

  /** GET /maintenance/tasks — Admin only */
  async getAllTasks(status?: string): Promise<ApiMaintenanceTask[]> {
    const url = status
      ? `${ENDPOINTS.MAINTENANCE.TASKS}?status=${status}`
      : ENDPOINTS.MAINTENANCE.TASKS;
    return httpClient.get<ApiMaintenanceTask[]>(url, true);
  },

  /** GET /maintenance/tasks/:id — Admin or assigned Technician */
  async getTaskById(id: string): Promise<ApiMaintenanceTask> {
    return httpClient.get<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.TASK_BY_ID(id),
      true,
    );
  },

  /** PATCH /maintenance/tasks/:id — Admin only */
  async updateTask(
    id: string,
    data: UpdateTaskRequest,
  ): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.TASK_BY_ID(id),
      data,
      true,
    );
  },

  /** PATCH /maintenance/tasks/:id/assign — Admin only */
  async assignTask(
    id: string,
    data: AssignTaskRequest,
  ): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.ASSIGN(id),
      data,
      true,
    );
  },

  /** PATCH /maintenance/tasks/:id/cancel — Admin only */
  async cancelTask(id: string): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.CANCEL(id),
      {},
      true,
    );
  },

  /** DELETE /maintenance/tasks/:id — Admin only */
  async deleteTask(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MAINTENANCE.TASK_BY_ID(id), true);
  },

  /** GET /maintenance/stats — Admin only */
  async getStats(): Promise<ApiMaintenanceStats> {
    return httpClient.get<ApiMaintenanceStats>(
      ENDPOINTS.MAINTENANCE.STATS,
      true,
    );
  },

  /** GET /maintenance/technicians — Admin only */
  async getTechnicians(): Promise<ApiTechnician[]> {
    return httpClient.get<ApiTechnician[]>(
      ENDPOINTS.MAINTENANCE.TECHNICIANS,
      true,
    );
  },

  /* ═══════════════════════════════════
     Technician Endpoints
     ═══════════════════════════════════ */

  /** GET /maintenance/my-status — Technician only */
  async getMyStatus(): Promise<{ technicianStatus: ApiTechnicianStatus }> {
    return httpClient.get<{ technicianStatus: ApiTechnicianStatus }>(
      ENDPOINTS.MAINTENANCE.MY_STATUS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** PATCH /maintenance/my-status — Technician only */
  async updateMyStatus(
    status: ApiTechnicianStatus,
  ): Promise<{ technicianStatus: ApiTechnicianStatus }> {
    return httpClient.patch<{ technicianStatus: ApiTechnicianStatus }>(
      ENDPOINTS.MAINTENANCE.MY_STATUS,
      { status },
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** GET /maintenance/my-tasks — Technician only */
  async getMyTasks(): Promise<ApiMaintenanceTask[]> {
    return httpClient.get<ApiMaintenanceTask[]>(
      ENDPOINTS.MAINTENANCE.MY_TASKS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** GET /maintenance/my-tasks/active — Technician only */
  async getMyActiveTasks(): Promise<ApiMaintenanceTask[]> {
    return httpClient.get<ApiMaintenanceTask[]>(
      ENDPOINTS.MAINTENANCE.MY_ACTIVE_TASKS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** PATCH /maintenance/tasks/:id/start — Technician only */
  async startTask(id: string): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.START(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** PATCH /maintenance/tasks/:id/pause — Technician only */
  async pauseTask(id: string): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.PAUSE(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** PATCH /maintenance/tasks/:id/resume — Technician only */
  async resumeTask(id: string): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.RESUME(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  /** PATCH /maintenance/tasks/:id/finish — Technician only */
  async finishTask(
    id: string,
    report: TaskReportRequest,
  ): Promise<ApiMaintenanceTask> {
    return httpClient.patch<ApiMaintenanceTask>(
      ENDPOINTS.MAINTENANCE.FINISH(id),
      report,
      true,
      TECH_TOKEN_KEY,
    );
  },
} as const;
