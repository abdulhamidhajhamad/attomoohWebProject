import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMaintenanceSchedule } from '../types';

export const maintenanceScheduleService = {
  async getAll(search?: string, tokenKey?: string, from?: string, to?: string): Promise<ApiMaintenanceSchedule[]> {
    const params = new URLSearchParams();
    const q = search?.trim();
    if (q) params.set('search', q);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    const url = query ? `${ENDPOINTS.MAINTENANCE_SCHEDULE.BASE}?${query}` : ENDPOINTS.MAINTENANCE_SCHEDULE.BASE;
    return httpClient.get<ApiMaintenanceSchedule[]>(url, true, tokenKey);
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
