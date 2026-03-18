import { createCrudStore } from './createCrudStore';
import { customerCallService } from '../api/services';
import type { ApiCustomerCall } from '../api/types';

export const useCustomerCallStore = createCrudStore<ApiCustomerCall>(customerCallService);
