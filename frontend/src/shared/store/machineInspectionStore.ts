import { createCrudStore } from './createCrudStore';
import { machineInspectionService } from '../api/services';
import type { ApiMachineInspection } from '../api/types';

export const useMachineInspectionStore = createCrudStore<ApiMachineInspection>(machineInspectionService);
