import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiFinancialDocument } from '../types';

export const financialDocumentsService = {
  async getAll(search?: string): Promise<ApiFinancialDocument[]> {
    const url = search ? `${ENDPOINTS.FINANCIAL_DOCUMENTS.BASE}?search=${encodeURIComponent(search)}` : ENDPOINTS.FINANCIAL_DOCUMENTS.BASE;
    return httpClient.get<ApiFinancialDocument[]>(url, true);
  },
  async getById(id: string): Promise<ApiFinancialDocument> {
    return httpClient.get<ApiFinancialDocument>(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_ID(id), true);
  },
  async create(data: Record<string, unknown>): Promise<ApiFinancialDocument> {
    return httpClient.post<ApiFinancialDocument>(ENDPOINTS.FINANCIAL_DOCUMENTS.BASE, data, true);
  },
  async update(id: string, data: Record<string, unknown>): Promise<ApiFinancialDocument> {
    return httpClient.patch<ApiFinancialDocument>(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_ID(id), data, true);
  },
  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_ID(id), true);
  },
  async getByCustomer(id: string): Promise<ApiFinancialDocument[]> {
    return httpClient.get<ApiFinancialDocument[]>(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_CUSTOMER(id), true);
  },
  async getBySupplier(id: string): Promise<ApiFinancialDocument[]> {
    return httpClient.get<ApiFinancialDocument[]>(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_SUPPLIER(id), true);
  },
  async getByTechnician(id: string): Promise<ApiFinancialDocument[]> {
    return httpClient.get<ApiFinancialDocument[]>(ENDPOINTS.FINANCIAL_DOCUMENTS.BY_TECHNICIAN(id), true);
  },
} as const;
