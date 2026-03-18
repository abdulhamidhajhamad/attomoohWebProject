import { createCrudStore } from './createCrudStore';
import { machineDeliveryService } from '../api/services';
import type { ApiMachineDelivery } from '../api/types';

export const useMachineDeliveryStore = createCrudStore<ApiMachineDelivery>(machineDeliveryService);
