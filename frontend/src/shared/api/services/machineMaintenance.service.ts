import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineMaint } from '../types';

export const machineMaintenanceService = {
  async getAll(searchOrParams?: string | { search?: string; status?: string }): Promise<ApiMachineMaint[]> {
    const query = new URLSearchParams();
    if (typeof searchOrParams === 'string') {
      if (searchOrParams.trim()) query.set('search', searchOrParams.trim());
    } else if (searchOrParams) {
      if (searchOrParams.search?.trim()) query.set('search', searchOrParams.search.trim());
      if (searchOrParams.status?.trim()) query.set('status', searchOrParams.status.trim());
    }
    const qs = query.toString();
    const url = qs ? `${ENDPOINTS.MACHINE_MAINTENANCE.BASE}?${qs}` : ENDPOINTS.MACHINE_MAINTENANCE.BASE;
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
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.PAUSE(id), { reason: pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineMaint> {
    return httpClient.post<ApiMachineMaint>(ENDPOINTS.MACHINE_MAINTENANCE.FINISH(id), undefined, true);
  },
} as const;
