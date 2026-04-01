import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMaintenanceSchedule } from '../types';

export const maintenanceScheduleService = {
  async getAll(search?: string): Promise<ApiMaintenanceSchedule[]> {
    const q = search?.trim();
    const url = q ? `${ENDPOINTS.MAINTENANCE_SCHEDULE.BASE}?search=${encodeURIComponent(q)}` : ENDPOINTS.MAINTENANCE_SCHEDULE.BASE;
    return httpClient.get<ApiMaintenanceSchedule[]>(url, true);
  },
  async getById(id: string): Promise<ApiMaintenanceSchedule> {
    return httpClient.get<ApiMaintenanceSchedule>(ENDPOINTS.MAINTENANCE_SCHEDULE.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMaintenanceSchedule> {
    return httpClient.post<ApiMaintenanceSchedule>(ENDPOINTS.MAINTENANCE_SCHEDULE.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMaintenanceSchedule> {
    return httpClient.patch<ApiMaintenanceSchedule>(ENDPOINTS.MAINTENANCE_SCHEDULE.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MAINTENANCE_SCHEDULE.BY_ID(id), true);
  },
  async reschedule(id: string, data: Record<string, unknown>): Promise<ApiMaintenanceSchedule> {
    return httpClient.patch<ApiMaintenanceSchedule>(ENDPOINTS.MAINTENANCE_SCHEDULE.RESCHEDULE(id), data, true);
  },
  async cancel(id: string, data: Record<string, unknown>): Promise<ApiMaintenanceSchedule> {
    return httpClient.patch<ApiMaintenanceSchedule>(ENDPOINTS.MAINTENANCE_SCHEDULE.CANCEL(id), data, true);
  },
} as const;
