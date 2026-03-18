import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiMachineInstallation } from '../types';

export const machineInstallationService = {
  async getAll(search?: string): Promise<ApiMachineInstallation[]> {
    const url = search ? `${ENDPOINTS.MACHINE_INSTALLATION.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.MACHINE_INSTALLATION.BASE;
    return httpClient.get<ApiMachineInstallation[]>(url, true);
  },
  async getById(id: string): Promise<ApiMachineInstallation> {
    return httpClient.get<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiMachineInstallation> {
    return httpClient.post<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiMachineInstallation> {
    return httpClient.patch<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.MACHINE_INSTALLATION.BY_ID(id), true);
  },
  async start(id: string): Promise<ApiMachineInstallation> {
    return httpClient.post<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.START(id), undefined, true);
  },
  async pause(id: string, pauseReason: string): Promise<ApiMachineInstallation> {
    return httpClient.post<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.PAUSE(id), { pauseReason }, true);
  },
  async resume(id: string): Promise<ApiMachineInstallation> {
    return httpClient.post<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.RESUME(id), undefined, true);
  },
  async finish(id: string): Promise<ApiMachineInstallation> {
    return httpClient.post<ApiMachineInstallation>(ENDPOINTS.MACHINE_INSTALLATION.FINISH(id), undefined, true);
  },
} as const;
