import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiSupplier } from '../types';

export const suppliersService = {
  async getAll(search?: string): Promise<ApiSupplier[]> {
    const url = search ? `${ENDPOINTS.SUPPLIERS.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.SUPPLIERS.BASE;
    return httpClient.get<ApiSupplier[]>(url, true);
  },
  async getById(id: string): Promise<ApiSupplier> {
    return httpClient.get<ApiSupplier>(ENDPOINTS.SUPPLIERS.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiSupplier> {
    return httpClient.post<ApiSupplier>(ENDPOINTS.SUPPLIERS.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiSupplier> {
    return httpClient.patch<ApiSupplier>(ENDPOINTS.SUPPLIERS.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.SUPPLIERS.BY_ID(id), true);
  },
} as const;
