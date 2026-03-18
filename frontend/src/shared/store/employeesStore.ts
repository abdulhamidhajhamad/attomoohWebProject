import { createCrudStore } from './createCrudStore';
import { employeesService } from '../api/services';
import type { ApiEmployee } from '../api/types';

export const useEmployeesStore = createCrudStore<ApiEmployee>(employeesService);
