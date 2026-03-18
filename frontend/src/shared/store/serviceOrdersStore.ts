import { create } from 'zustand';
import { customersService, machineTypesService, serviceOrdersService } from '../api/services';
import type {
  ApiCustomer,
  ApiMachineType,
  ApiServiceOrder,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateMachineTypeRequest,
  UpdateMachineTypeRequest,
  CreateServiceOrderRequest,
  UpdateServiceOrderRequest,
  CompleteServiceOrderRequest,
  AssignServiceOrderRequest,
  ReportByMachineType,
  ReportByTechnician,
  ReportByCustomer,
} from '../api/types';

/**
 * ===== Service Orders Store =====
 * إدارة أوامر الخدمة + الزبائن + أنواع الآلات
 */

interface ServiceOrdersStore {
  // ── State ──
  customers: ApiCustomer[];
  machineTypes: ApiMachineType[];
  orders: ApiServiceOrder[];
  myOrders: ApiServiceOrder[];
  orderStats: { byStatus: Record<string, number>; total: number } | null;
  reportByMachine: ReportByMachineType[];
  reportByTechnician: ReportByTechnician[];
  reportByCustomer: ReportByCustomer[];
  loading: boolean;
  error: string | null;

  // ── Customer Actions ──
  fetchCustomers: (search?: string) => Promise<void>;
  createCustomer: (data: CreateCustomerRequest) => Promise<ApiCustomer>;
  updateCustomer: (id: string, data: UpdateCustomerRequest) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // ── Machine Type Actions ──
  fetchMachineTypes: () => Promise<void>;
  createMachineType: (data: CreateMachineTypeRequest) => Promise<ApiMachineType>;
  updateMachineType: (id: string, data: UpdateMachineTypeRequest) => Promise<void>;
  deleteMachineType: (id: string) => Promise<void>;

  // ── Service Order Admin Actions ──
  fetchOrders: (status?: string) => Promise<void>;
  fetchOrderStats: () => Promise<void>;
  createOrder: (data: CreateServiceOrderRequest) => Promise<ApiServiceOrder>;
  updateOrder: (id: string, data: UpdateServiceOrderRequest) => Promise<void>;
  assignOrder: (id: string, data: AssignServiceOrderRequest) => Promise<void>;
  deliverOrder: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // ── Reports ──
  fetchReportByMachine: () => Promise<void>;
  fetchReportByTechnician: () => Promise<void>;
  fetchReportByCustomer: () => Promise<void>;

  // ── Technician Actions ──
  fetchMyOrders: () => Promise<void>;
  fetchMyActiveOrders: () => Promise<void>;
  startWork: (id: string) => Promise<void>;
  pauseWork: (id: string) => Promise<void>;
  resumeWork: (id: string) => Promise<void>;
  completeOrder: (id: string, data: CompleteServiceOrderRequest) => Promise<void>;

  // ── Shared ──
  fetchOrderById: (id: string) => Promise<ApiServiceOrder>;
  clearError: () => void;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function upsertOrder(
  list: ApiServiceOrder[],
  updated: ApiServiceOrder,
): ApiServiceOrder[] {
  const idx = list.findIndex((o) => o._id === updated._id);
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = updated;
    return copy;
  }
  return [updated, ...list];
}

export const useServiceOrdersStore = create<ServiceOrdersStore>()((set) => ({
  customers: [],
  machineTypes: [],
  orders: [],
  myOrders: [],
  orderStats: null,
  reportByMachine: [],
  reportByTechnician: [],
  reportByCustomer: [],
  loading: false,
  error: null,

  /* ═══════════════════════════════════
     Customers
     ═══════════════════════════════════ */

  fetchCustomers: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const customers = await customersService.getAll(search);
      set({ customers, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  createCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const customer = await customersService.create(data);
      set((s) => ({ customers: [customer, ...s.customers], loading: false }));
      return customer;
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
      throw e;
    }
  },

  updateCustomer: async (id, data) => {
    set({ error: null });
    try {
      const updated = await customersService.update(id, data);
      set((s) => ({
        customers: s.customers.map((c) => (c._id === id ? updated : c)),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deleteCustomer: async (id) => {
    set({ error: null });
    try {
      await customersService.delete(id);
      set((s) => ({
        customers: s.customers.filter((c) => c._id !== id),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Machine Types
     ═══════════════════════════════════ */

  fetchMachineTypes: async () => {
    set({ loading: true, error: null });
    try {
      const machineTypes = await machineTypesService.getAll();
      set({ machineTypes, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  createMachineType: async (data) => {
    set({ loading: true, error: null });
    try {
      const mt = await machineTypesService.create(data);
      set((s) => ({ machineTypes: [mt, ...s.machineTypes], loading: false }));
      return mt;
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
      throw e;
    }
  },

  updateMachineType: async (id, data) => {
    set({ error: null });
    try {
      const updated = await machineTypesService.update(id, data);
      set((s) => ({
        machineTypes: s.machineTypes.map((m) => (m._id === id ? updated : m)),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deleteMachineType: async (id) => {
    set({ error: null });
    try {
      await machineTypesService.delete(id);
      set((s) => ({
        machineTypes: s.machineTypes.filter((m) => m._id !== id),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Service Orders (Admin)
     ═══════════════════════════════════ */

  fetchOrders: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const orders = await serviceOrdersService.getAll(status);
      set({ orders, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  fetchOrderStats: async () => {
    try {
      const orderStats = await serviceOrdersService.getStats();
      set({ orderStats });
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  createOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const order = await serviceOrdersService.create(data);
      set((s) => ({ orders: [order, ...s.orders], loading: false }));
      return order;
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
      throw e;
    }
  },

  updateOrder: async (id, data) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.update(id, data);
      set((s) => ({ orders: upsertOrder(s.orders, updated) }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  assignOrder: async (id, data) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.assign(id, data);
      set((s) => ({ orders: upsertOrder(s.orders, updated) }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deliverOrder: async (id) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.deliver(id);
      set((s) => ({ orders: upsertOrder(s.orders, updated) }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deleteOrder: async (id) => {
    set({ error: null });
    try {
      await serviceOrdersService.delete(id);
      set((s) => ({ orders: s.orders.filter((o) => o._id !== id) }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Reports
     ═══════════════════════════════════ */

  fetchReportByMachine: async () => {
    try {
      const reportByMachine = await serviceOrdersService.reportByMachineType();
      set({ reportByMachine });
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  fetchReportByTechnician: async () => {
    try {
      const reportByTechnician = await serviceOrdersService.reportByTechnician();
      set({ reportByTechnician });
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  fetchReportByCustomer: async () => {
    try {
      const reportByCustomer = await serviceOrdersService.reportByCustomer();
      set({ reportByCustomer });
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  /* ═══════════════════════════════════
     Technician Actions
     ═══════════════════════════════════ */

  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const myOrders = await serviceOrdersService.getMyOrders();
      set({ myOrders, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  fetchMyActiveOrders: async () => {
    set({ loading: true, error: null });
    try {
      const myOrders = await serviceOrdersService.getMyActiveOrders();
      set({ myOrders, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  startWork: async (id) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.startWork(id);
      set((s) => ({
        myOrders: upsertOrder(s.myOrders, updated),
        orders: upsertOrder(s.orders, updated),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  pauseWork: async (id) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.pauseWork(id);
      set((s) => ({
        myOrders: upsertOrder(s.myOrders, updated),
        orders: upsertOrder(s.orders, updated),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  resumeWork: async (id) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.resumeWork(id);
      set((s) => ({
        myOrders: upsertOrder(s.myOrders, updated),
        orders: upsertOrder(s.orders, updated),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  completeOrder: async (id, data) => {
    set({ error: null });
    try {
      const updated = await serviceOrdersService.completeOrder(id, data);
      set((s) => ({
        myOrders: upsertOrder(s.myOrders, updated),
        orders: upsertOrder(s.orders, updated),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  /* ═══════════════════════════════════
     Shared
     ═══════════════════════════════════ */

  fetchOrderById: async (id) => {
    try {
      return await serviceOrdersService.getById(id);
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
