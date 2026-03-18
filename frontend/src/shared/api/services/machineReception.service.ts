import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineReception } from '../types';

export const machineReceptionService = {
  async getAll(search?: string): Promise<ApiMachineReception[]> {
    const url = search ? `${ENDPOINTS.MACHINE_RECEPTION.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINE_RECEPTION.BASE;
    return httpClient.get<ApiMachineReception[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineReception> {
    return httpClient.get<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineReception> {
    return httpClient.patch<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_RECEPTION.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.PAUSE(id), { pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.FINISH(id), undefined, true);
  },
} as const;
