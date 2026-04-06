/**
 * Technician Tasks Service
 *
 * خدمة موحدة لإدارة مهام الفني (فحص/صيانة/تنصيب/إنتاج)
 * تستخدم توكن الفني المنفصل عن توكن الأدمن
 */

import { httpClient, TECH_TOKEN_KEY } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiMachineInspection,
  ApiMachineMaint,
  ApiMachineInstallation,
  ApiMachineProduction,
  ApiInspectionSparePart,
} from '../types';

/** أنواع المهام */
export type TaskType = 'inspection' | 'maintenance' | 'installation' | 'production';

/** المهمة الموحدة */
export interface UnifiedTask {
  _id: string;
  taskType: TaskType;
  machineName: string;
  machineDetails: string;
  technicianName: string;
  status: string;
  date: string;
  time: string;
  timeLogs: Array<{ action: string; timestamp: string; pauseReason: string }>;
  pauseReason: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  rejectionReason: string;
  spareParts: ApiInspectionSparePart[];
  technicianReport: string;
  durationMs: number;
  technicianFee: number;
  companyFee: number;
  readyForDelivery: boolean;
  machineReception: unknown;
  createdAt: string;
  updatedAt: string;
}

/** تقرير إنهاء المهمة */
export interface TaskReportPayload {
  pauseReason?: string;
  spareParts?: { name: string; quantity: number; cost?: number }[];
  technicianReport?: string;
  technicianFee?: number;
  companyFee?: number;
}

/** رد API للمهام */
export type TaskApiResponse = ApiMachineInspection | ApiMachineMaint | ApiMachineInstallation | ApiMachineProduction;

export const technicianTasksService = {
  /**
   * جلب كل مهام الفني
   */
  async getMyTasks(): Promise<UnifiedTask[]> {
    return httpClient.get<UnifiedTask[]>(
      ENDPOINTS.TECHNICIAN_TASKS.MY_TASKS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /**
   * بدء العمل على مهمة
   */
  async startTask(type: TaskType, id: string): Promise<TaskApiResponse> {
    return httpClient.patch<TaskApiResponse>(
      ENDPOINTS.TECHNICIAN_TASKS.START(type, id),
      undefined,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /**
   * إيقاف مؤقت
   */
  async pauseTask(type: TaskType, id: string, reason?: string): Promise<TaskApiResponse> {
    return httpClient.patch<TaskApiResponse>(
      ENDPOINTS.TECHNICIAN_TASKS.PAUSE(type, id),
      { reason: reason || '' },
      true,
      TECH_TOKEN_KEY,
    );
  },

  /**
   * استئناف العمل
   */
  async resumeTask(type: TaskType, id: string): Promise<TaskApiResponse> {
    return httpClient.patch<TaskApiResponse>(
      ENDPOINTS.TECHNICIAN_TASKS.RESUME(type, id),
      undefined,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /**
   * إنهاء المهمة مع التقرير
   */
  async finishTask(type: TaskType, id: string, report?: TaskReportPayload): Promise<TaskApiResponse> {
    return httpClient.patch<TaskApiResponse>(
      ENDPOINTS.TECHNICIAN_TASKS.FINISH(type, id),
      report,
      true,
      TECH_TOKEN_KEY,
    );
  },

  /**
   * رفض المهمة
   */
  async rejectTask(type: TaskType, id: string, reason: string): Promise<TaskApiResponse> {
    return httpClient.patch<TaskApiResponse>(
      ENDPOINTS.TECHNICIAN_TASKS.REJECT(type, id),
      { reason },
      true,
      TECH_TOKEN_KEY,
    );
  },
} as const;
