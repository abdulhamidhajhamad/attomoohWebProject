import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineMaint } from '../types';

export const machineMaintenanceService = {
  async getAll(search?: string): Promise<ApiMachineMaint[]> {
    const url = search ? `${ENDPOINTS.MACHINE_MAINTENANCE.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINE_MAINTENANCE.BASE;
    return httpClient.get<ApiMachineMaint[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineMaint> {
    return httpClient.get<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineMaint> {
    return httpClient.patch<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_MAINTENANCE.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.PAUSE(id), { pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.FINISH(id), undefined, true);
  },
} as const;
