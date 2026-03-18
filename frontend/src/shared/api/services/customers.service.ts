/**
 * Customers Service — Customer API calls (Admin only)
 */

import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../types';

export const customersService = {
  async getAll(search?: string): Promise<ApiCustomer[]> {
    const url = search
      ? `${ENDPOINTS.CUSTOMERS.BASE}?search=${encodeURIComponent(search)}`
      : ENDPOINTS.CUSTOMERS.BASE;
    return httpClient.get<ApiCustomer[]>(url, true);
  },

  async getById(id: string): Promise<ApiCustomer> {
    return httpClient.get<ApiCustomer>(ENDPOINTS.CUSTOMERS.BY_ID(id), true);
  },

  async create(data: CreateCustomerRequest): Promise<ApiCustomer> {
    return httpClient.post<ApiCustomer>(ENDPOINTS.CUSTOMERS.BASE, data, true);
  },

  async update(id: string, data: UpdateCustomerRequest): Promise<ApiCustomer> {
    return httpClient.patch<ApiCustomer>(
      ENDPOINTS.CUSTOMERS.BY_ID(id),
      data,
      true,
    );
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.CUSTOMERS.BY_ID(id), true);
  },
} as const;
