import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiVehicle } from '../types';

export const vehiclesService = {
  async getAll(search?: string): Promise<ApiVehicle[]> {
    const url = search ? `${ENDPOINTS.VEHICLES.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.VEHICLES.BASE;
    return httpClient.get<ApiVehicle[]>(url, true);
  },
  async getById(id: string): Promise<ApiVehicle> {
    return httpClient.get<ApiVehicle>(ENDPOINTS.VEHICLES.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiVehicle> {
    return httpClient.post<ApiVehicle>(ENDPOINTS.VEHICLES.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiVehicle> {
    return httpClient.patch<ApiVehicle>(ENDPOINTS.VEHICLES.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.VEHICLES.BY_ID(id), true);
  },
} as const;
