import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiTransport } from '../types';

export const transportService = {
  async getAll(search?: string): Promise<ApiTransport[]> {
    const url = search ? `${ENDPOINTS.TRANSPORT.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.TRANSPORT.BASE;
    return httpClient.get<ApiTransport[]>(url, true);
  },
  async getById(id: string): Promise<ApiTransport> {
    return httpClient.get<ApiTransport>(ENDPOINTS.TRANSPORT.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiTransport> {
    return httpClient.post<ApiTransport>(ENDPOINTS.TRANSPORT.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiTransport> {
    return httpClient.patch<ApiTransport>(ENDPOINTS.TRANSPORT.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.TRANSPORT.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiTransport> {
    return httpClient.post<ApiTransport>(ENDPOINTS.TRANSPORT.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiTransport> {
    return httpClient.post<ApiTransport>(ENDPOINTS.TRANSPORT.PAUSE(id), { pauseReason }, true);
  },
  async resume(id: string): Promise<ApiTransport> {
    return httpClient.post<ApiTransport>(ENDPOINTS.TRANSPORT.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiTransport> {
    return httpClient.post<ApiTransport>(ENDPOINTS.TRANSPORT.FINISH(id), undefined, true);
  },
} as const;
