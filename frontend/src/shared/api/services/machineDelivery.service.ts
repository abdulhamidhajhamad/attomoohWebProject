import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineDelivery } from '../types';

export const machineDeliveryService = {
  async getAll(search?: string): Promise<ApiMachineDelivery[]> {
    const url = search ? `${ENDPOINTS.MACHINE_DELIVERY.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINE_DELIVERY.BASE;
    return httpClient.get<ApiMachineDelivery[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineDelivery> {
    return httpClient.get<ApiMachineDelivery>(ENDPOINTS.MACHINE_DELIVERY.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineDelivery> {
    return httpClient.post<ApiMachineDelivery>(ENDPOINTS.MACHINE_DELIVERY.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineDelivery> {
    return httpClient.patch<ApiMachineDelivery>(ENDPOINTS.MACHINE_DELIVERY.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_DELIVERY.BY_ID(id), true);
  },
} as const;
