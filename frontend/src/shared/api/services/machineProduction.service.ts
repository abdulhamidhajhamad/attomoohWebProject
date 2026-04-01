import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineProduction } from '../types';

export const machineProductionService = {
  async getAll(search?: string): Promise<ApiMachineProduction[]> {
    const url = search?.trim()
      ? `${ENDPOINTS.MACHINE_PRODUCTION.BASE}?search=${encodeURIComponent(search.trim())}`
      : ENDPOINTS.MACHINE_PRODUCTION.BASE;
    return httpClient.get<ApiMachineProduction[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineProduction> {
    return httpClient.get<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineProduction> {
    return httpClient.post<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineProduction> {
    return httpClient.patch<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_PRODUCTION.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiMachineProduction> {
    return httpClient.post<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiMachineProduction> {
    return httpClient.post<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.PAUSE(id), { reason: pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineProduction> {
    return httpClient.post<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineProduction> {
    return httpClient.post<ApiMachineProduction>(ENDPOINTS.MACHINE_PRODUCTION.FINISH(id), undefined, true);
  },
} as const;
