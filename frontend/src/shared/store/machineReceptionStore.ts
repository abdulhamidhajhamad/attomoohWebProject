import { createCrudStore } from './createCrudStore';
import { machineReceptionService } from '../api/services';
import type { ApiMachineReception } from '../api/types';

export const useMachineReceptionStore = createCrudStore<ApiMachineReception>(machineReceptionService);
