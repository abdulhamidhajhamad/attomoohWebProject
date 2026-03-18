import { createCrudStore } from './createCrudStore';
import { vehiclesService } from '../api/services';
import type { ApiVehicle } from '../api/types';

export const useVehiclesStore = createCrudStore<ApiVehicle>(vehiclesService);
