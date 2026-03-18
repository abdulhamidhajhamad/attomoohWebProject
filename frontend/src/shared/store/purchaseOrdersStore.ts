import { createCrudStore } from './createCrudStore';
import { purchaseOrdersService } from '../api/services';
import type { ApiPurchaseOrder } from '../api/types';

export const usePurchaseOrdersStore = createCrudStore<ApiPurchaseOrder>(purchaseOrdersService);
