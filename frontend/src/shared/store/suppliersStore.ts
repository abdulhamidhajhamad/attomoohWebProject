import { createCrudStore } from './createCrudStore';
import { suppliersService } from '../api/services';
import type { ApiSupplier } from '../api/types';

export const useSuppliersStore = createCrudStore<ApiSupplier>(suppliersService);
