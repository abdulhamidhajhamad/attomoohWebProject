import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiCustomerCall } from '../types';

export const customerCallService = {
  async getAll(search?: string): Promise<ApiCustomerCall[]> {
    const url = search ? `${ENDPOINTS.CUSTOMER_CALL.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.CUSTOMER_CALL.BASE;
    return httpClient.get<ApiCustomerCall[]>(url, true);
  },
  async getById(id: string): Promise<ApiCustomerCall> {
    return httpClient.get<ApiCustomerCall>(ENDPOINTS.CUSTOMER_CALL.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiCustomerCall> {
    return httpClient.post<ApiCustomerCall>(ENDPOINTS.CUSTOMER_CALL.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiCustomerCall> {
    return httpClient.patch<ApiCustomerCall>(ENDPOINTS.CUSTOMER_CALL.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.CUSTOMER_CALL.BY_ID(id), true);
  },
} as const;
