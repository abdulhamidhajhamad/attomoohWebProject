import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiPurchaseOrder } from '../types';

export const purchaseOrdersService = {
  async getAll(search?: string): Promise<ApiPurchaseOrder[]> {
    const url = search ? `${ENDPOINTS.PURCHASE_ORDERS.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.PURCHASE_ORDERS.BASE;
    return httpClient.get<ApiPurchaseOrder[]>(url, true);
  },
  async getById(id: string): Promise<ApiPurchaseOrder> {
    return httpClient.get<ApiPurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiPurchaseOrder> {
    return httpClient.post<ApiPurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiPurchaseOrder> {
    return httpClient.patch<ApiPurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.PURCHASE_ORDERS.BY_ID(id), true);
  },
  async approve(id: string): Promise<ApiPurchaseOrder> {
    return httpClient.patch<ApiPurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS.APPROVE(id), undefined, true);
  },
} as const;
