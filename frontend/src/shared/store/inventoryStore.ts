import { createCrudStore } from './createCrudStore';
import { inventoryService } from '../api/services';
import type { ApiInventoryItem } from '../api/types';

export const useInventoryStore = createCrudStore<ApiInventoryItem>(inventoryService);
