import { createCrudStore } from './createCrudStore';
import { areasService } from '../api/services';
import type { ApiArea } from '../api/types';

export const useAreasStore = createCrudStore<ApiArea>(areasService);
