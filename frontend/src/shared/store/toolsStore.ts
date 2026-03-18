import { createCrudStore } from './createCrudStore';
import { toolsService } from '../api/services';
import type { ApiTool } from '../api/types';

export const useToolsStore = createCrudStore<ApiTool>(toolsService);
