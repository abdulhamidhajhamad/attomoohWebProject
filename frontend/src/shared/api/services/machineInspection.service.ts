import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineInspection } from '../types';

export const machineInspectionService = {
  async getAll(search?: string): Promise<ApiMachineInspection[]> {
    const url = search ? `${ENDPOINTS.MACHINE_INSPECTION.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINE_INSPECTION.BASE;
    return httpClient.get<ApiMachineInspection[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineInspection> {
    return httpClient.get<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineInspection> {
    return httpClient.post<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineInspection> {
    return httpClient.patch<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_INSPECTION.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiMachineInspection> {
    return httpClient.post<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiMachineInspection> {
    return httpClient.post<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.PAUSE(id), { pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineInspection> {
    return httpClient.post<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineInspection> {
    return httpClient.post<ApiMachineInspection>(ENDPOINTS.MACHINE_INSPECTION.FINISH(id), undefined, true);
  },
} as const;
