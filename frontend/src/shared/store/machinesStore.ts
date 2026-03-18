import { createCrudStore } from './createCrudStore';
import { machinesService } from '../api/services';
import type { ApiMachine } from '../api/types';

export const useMachinesStore = createCrudStore<ApiMachine>(machinesService);
