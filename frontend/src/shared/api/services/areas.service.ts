import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiArea } from '../types';

export const areasService = {
  async getAll(search?: string): Promise<ApiArea[]> {
    const url = search ? `${ENDPOINTS.AREAS.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.AREAS.BASE;
    return httpClient.get<ApiArea[]>(url, true);
  },
  async getById(id: string): Promise<ApiArea> {
    return httpClient.get<ApiArea>(ENDPOINTS.AREAS.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiArea> {
    return httpClient.post<ApiArea>(ENDPOINTS.AREAS.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiArea> {
    return httpClient.patch<ApiArea>(ENDPOINTS.AREAS.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.AREAS.BY_ID(id), true);
  },
} as const;
