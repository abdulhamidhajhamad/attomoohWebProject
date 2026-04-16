/**
 * Service Orders Service — Service Order API calls
 *
 * Admin endpoints:
 *   POST   /service-orders               → إنشاء أمر خدمة (استلام آلة)
 *   GET    /service-orders               → قائمة الأوامر
 *   GET    /service-orders/:id           → تفاصيل أمر
 *   PATCH  /service-orders/:id           → تعديل أمر
 *   PATCH  /service-orders/:id/assign    → تعيين فني
 *   PATCH  /service-orders/:id/deliver   → تسليم الآلة
 *   DELETE /service-orders/:id           → حذف
 *   GET    /service-orders/stats         → إحصائيات
 *   GET    /service-orders/reports/...   → تقارير
 *
 * Technician endpoints:
 *   GET    /service-orders/my-orders         → أوامري
 *   GET    /service-orders/my-orders/active  → أوامري النشطة
 *   PATCH  /service-orders/:id/start         → بدء
 *   PATCH  /service-orders/:id/pause         → إيقاف مؤقت
 *   PATCH  /service-orders/:id/resume        → استئناف
 *   PATCH  /service-orders/:id/complete      → إنهاء + تقرير
 */

import { httpClient, TECH_TOKEN_KEY } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiServiceOrder,
  ApiTechnicianTaskDetails,
  CreateServiceOrderRequest,
  UpdateServiceOrderRequest,
  CompleteServiceOrderRequest,
  AssignServiceOrderRequest,
  ReportByMachineType,
  ReportByTechnician,
  ReportByCustomer,
} from '../types';

export const serviceOrdersService = {
  /* ── Admin ── */

  async create(data: CreateServiceOrderRequest): Promise<ApiServiceOrder> {
    return httpClient.post<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.BASE,
      data,
      true,
    );
  },

  async getAll(status?: string): Promise<ApiServiceOrder[]> {
    const url = status
      ? `${ENDPOINTS.SERVICE_ORDERS.BASE}?status=${status}`
      : ENDPOINTS.SERVICE_ORDERS.BASE;
    return httpClient.get<ApiServiceOrder[]>(url, true);
  },

  async getById(id: string): Promise<ApiServiceOrder> {
    return httpClient.get<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.BY_ID(id),
      true,
    );
  },

  async getByTechnician(technicianId: string): Promise<ApiServiceOrder[]> {
    return httpClient.get<ApiServiceOrder[]>(
      ENDPOINTS.SERVICE_ORDERS.BY_TECHNICIAN(technicianId),
      true,
    );
  },

  async getTechnicianTasks(
    technicianId: string,
  ): Promise<ApiTechnicianTaskDetails[]> {
    return httpClient.get<ApiTechnicianTaskDetails[]>(
      ENDPOINTS.SERVICE_ORDERS.BY_TECHNICIAN_TASKS(technicianId),
      true,
    );
  },

  async getByCustomer(customerId: string): Promise<ApiServiceOrder[]> {
    return httpClient.get<ApiServiceOrder[]>(
      ENDPOINTS.SERVICE_ORDERS.BY_CUSTOMER(customerId),
      true,
    );
  },

  async update(
    id: string,
    data: UpdateServiceOrderRequest,
  ): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.BY_ID(id),
      data,
      true,
    );
  },

  async assign(
    id: string,
    data: AssignServiceOrderRequest,
  ): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.ASSIGN(id),
      data,
      true,
    );
  },

  async deliver(id: string): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.DELIVER(id),
      {},
      true,
    );
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(ENDPOINTS.SERVICE_ORDERS.BY_ID(id), true);
  },

  async getStats(): Promise<{ byStatus: Record<string, number>; total: number }> {
    return httpClient.get(ENDPOINTS.SERVICE_ORDERS.STATS, true);
  },

  async reportByMachineType(): Promise<ReportByMachineType[]> {
    return httpClient.get<ReportByMachineType[]>(
      ENDPOINTS.SERVICE_ORDERS.REPORT_BY_MACHINE,
      true,
    );
  },

  async reportByTechnician(): Promise<ReportByTechnician[]> {
    return httpClient.get<ReportByTechnician[]>(
      ENDPOINTS.SERVICE_ORDERS.REPORT_BY_TECHNICIAN,
      true,
    );
  },

  async reportByCustomer(): Promise<ReportByCustomer[]> {
    return httpClient.get<ReportByCustomer[]>(
      ENDPOINTS.SERVICE_ORDERS.REPORT_BY_CUSTOMER,
      true,
    );
  },

  /* ── Technician ── */

  async getMyOrders(): Promise<ApiServiceOrder[]> {
    return httpClient.get<ApiServiceOrder[]>(
      ENDPOINTS.SERVICE_ORDERS.MY_ORDERS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  async getMyActiveOrders(): Promise<ApiServiceOrder[]> {
    return httpClient.get<ApiServiceOrder[]>(
      ENDPOINTS.SERVICE_ORDERS.MY_ACTIVE_ORDERS,
      true,
      TECH_TOKEN_KEY,
    );
  },

  async startWork(id: string): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.START(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  async pauseWork(id: string): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.PAUSE(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  async resumeWork(id: string): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.RESUME(id),
      {},
      true,
      TECH_TOKEN_KEY,
    );
  },

  async completeOrder(
    id: string,
    data: CompleteServiceOrderRequest,
  ): Promise<ApiServiceOrder> {
    return httpClient.patch<ApiServiceOrder>(
      ENDPOINTS.SERVICE_ORDERS.COMPLETE(id),
      data,
      true,
      TECH_TOKEN_KEY,
    );
  },
} as const;
