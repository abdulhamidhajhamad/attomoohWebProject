import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineReception } from '../types';

export const machineReceptionService = {
  async getAll(
    searchOrParams?: string | { search?: string; status?: string; excludeAssigned?: boolean },
  ): Promise<ApiMachineReception[]> {
    const query = new URLSearchParams();

    if (typeof searchOrParams === 'string') {
      if (searchOrParams.trim()) query.set('search', searchOrParams.trim());
    } else if (searchOrParams) {
      if (searchOrParams.search?.trim()) query.set('search', searchOrParams.search.trim());
      if (searchOrParams.status?.trim()) query.set('status', searchOrParams.status.trim());
      if (searchOrParams.excludeAssigned) query.set('excludeAssigned', 'true');
    }

    const qs = query.toString();
    const url = qs ? `${ENDPOINTS.MACHINE_RECEPTION.BASE}?${qs}` : ENDPOINTS.MACHINE_RECEPTION.BASE;
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
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.PAUSE(id), { reason: pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineReception> {
    return httpClient.post<ApiMachineReception>(ENDPOINTS.MACHINE_RECEPTION.FINISH(id), undefined, true);
  },
} as const;
