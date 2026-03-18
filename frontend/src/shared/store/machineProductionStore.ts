import { createCrudStore } from './createCrudStore';
import { machineProductionService } from '../api/services';
import type { ApiMachineProduction } from '../api/types';

export const useMachineProductionStore = createCrudStore<ApiMachineProduction>(machineProductionService);
