/**
 * Machine Types Service — MachineType API calls (Admin only)
 */

import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiMachineType,
  CreateMachineTypeRequest,
  UpdateMachineTypeRequest,
} from '../types';

export const machineTypesService = {
  async getAll(): Promise<ApiMachineType[]> {
    return httpClient.get<ApiMachineType[]>(ENDPOINTS.MACHINE_TYPES.BASE, true);
  },

  async getById(id: string): Promise<ApiMachineType> {
    return httpClient.get<ApiMachineType>(
      ENDPOINTS.MACHINE_TYPES.BY_ID(id),
      true,
    );
  },

  async create(data: CreateMachineTypeRequest): Promise<ApiMachineType> {
    return httpClient.post<ApiMachineType>(
      ENDPOINTS.MACHINE_TYPES.BASE,
      data,
      true,
    );
  },

  async update(
    id: string,
    data: UpdateMachineTypeRequest,
  ): Promise<ApiMachineType> {
    return httpClient.patch<ApiMachineType>(
      ENDPOINTS.MACHINE_TYPES.BY_ID(id),
      data,
      true,
    );
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_TYPES.BY_ID(id), true);
  },
} as const;
