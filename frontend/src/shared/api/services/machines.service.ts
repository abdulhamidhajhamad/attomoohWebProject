import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachine } from '../types';

export const machinesService = {
  async getAll(search?: string): Promise<ApiMachine[]> {
    const url = search ? `${ENDPOINTS.MACHINES.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINES.BASE;
    return httpClient.get<ApiMachine[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachine> {
    return httpClient.get<ApiMachine>(ENDPOINTS.MACHINES.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachine> {
    return httpClient.post<ApiMachine>(ENDPOINTS.MACHINES.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachine> {
    return httpClient.patch<ApiMachine>(ENDPOINTS.MACHINES.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINES.BY_ID(id), true);
  },
} as const;
