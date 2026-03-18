import { createCrudStore } from './createCrudStore';
import { machineMaintenanceService } from '../api/services';
import type { ApiMachineMaint } from '../api/types';

export const useMachineMaintenanceStore = createCrudStore<ApiMachineMaint>(machineMaintenanceService);
