import { createCrudStore } from './createCrudStore';
import { maintenanceScheduleService } from '../api/services';
import type { ApiMaintenanceSchedule } from '../api/types';

export const useMaintenanceScheduleStore = createCrudStore<ApiMaintenanceSchedule>(maintenanceScheduleService);
