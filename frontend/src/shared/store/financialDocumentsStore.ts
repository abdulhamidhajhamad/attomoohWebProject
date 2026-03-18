import { createCrudStore } from './createCrudStore';
import { financialDocumentsService } from '../api/services';
import type { ApiFinancialDocument } from '../api/types';

export const useFinancialDocumentsStore = createCrudStore<ApiFinancialDocument>(financialDocumentsService);
