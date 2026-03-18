import { createCrudStore } from './createCrudStore';
import { machineInstallationService } from '../api/services';
import type { ApiMachineInstallation } from '../api/types';

export const useMachineInstallationStore = createCrudStore<ApiMachineInstallation>(machineInstallationService);
