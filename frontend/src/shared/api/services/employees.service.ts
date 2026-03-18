import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiEmployee } from '../types';

export const employeesService = {
  async getAll(search?: string): Promise<ApiEmployee[]> {
    const url = search ? `${ENDPOINTS.EMPLOYEES.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.EMPLOYEES.BASE;
    return httpClient.get<ApiEmployee[]>(url, true);
  },
  async getById(id: string): Promise<ApiEmployee> {
    return httpClient.get<ApiEmployee>(ENDPOINTS.EMPLOYEES.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiEmployee> {
    return httpClient.post<ApiEmployee>(ENDPOINTS.EMPLOYEES.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiEmployee> {
    return httpClient.patch<ApiEmployee>(ENDPOINTS.EMPLOYEES.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.EMPLOYEES.BY_ID(id), true);
  },
} as const;
