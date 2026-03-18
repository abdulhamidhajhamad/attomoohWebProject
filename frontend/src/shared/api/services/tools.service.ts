import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiTool } from '../types';

export const toolsService = {
  async getAll(search?: string): Promise<ApiTool[]> {
    const url = search ? `${ENDPOINTS.TOOLS.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.TOOLS.BASE;
    return httpClient.get<ApiTool[]>(url, true);
  },
  async getById(id: string): Promise<ApiTool> {
    return httpClient.get<ApiTool>(ENDPOINTS.TOOLS.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiTool> {
    return httpClient.post<ApiTool>(ENDPOINTS.TOOLS.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiTool> {
    return httpClient.patch<ApiTool>(ENDPOINTS.TOOLS.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.TOOLS.BY_ID(id), true);
  },
} as const;
