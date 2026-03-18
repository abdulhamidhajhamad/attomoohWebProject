import { createCrudStore } from './createCrudStore';
import { transportService } from '../api/services';
import type { ApiTransport } from '../api/types';

export const useTransportStore = createCrudStore<ApiTransport>(transportService);
