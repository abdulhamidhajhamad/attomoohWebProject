import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiInventoryItem } from '../types';

export const inventoryService = {
  async getAll(search?: string): Promise<ApiInventoryItem[]> {
    const url = search ? `${ENDPOINTS.INVENTORY.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.INVENTORY.BASE;
    return httpClient.get<ApiInventoryItem[]>(url, true);
  },
  async getById(id: string): Promise<ApiInventoryItem> {
    return httpClient.get<ApiInventoryItem>(ENDPOINTS.INVENTORY.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiInventoryItem> {
    return httpClient.post<ApiInventoryItem>(ENDPOINTS.INVENTORY.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiInventoryItem> {
    return httpClient.patch<ApiInventoryItem>(ENDPOINTS.INVENTORY.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.INVENTORY.BY_ID(id), true);
  },
} as const;
