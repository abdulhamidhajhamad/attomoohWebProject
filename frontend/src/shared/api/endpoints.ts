/**
 * API Endpoints — Centralized endpoint paths
 *
 * جميع المسارات في مكان واحد — عند تغيير أي مسار في الباك، عدّله هنا فقط
 * عند الـ deploy غيّر الـ API_BASE_URL في ملف .env ومش لازم تفتح أي ملف ثاني
 */

export const ENDPOINTS = {
  // ── Auth ──
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
  },

  // ── Categories ──
  CATEGORIES: {
    BASE: '/categories',
    TREE: '/categories/tree',
    ROOTS: '/categories/roots',
    BY_ID: (id: string) => `/categories/${id}`,
    CHILDREN: (id: string) => `/categories/${id}/children`,
  },

  // ── Products ──
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    BY_CATEGORY: (categoryId: string) => `/products/category/${categoryId}`,
  },

  // ── Users ──
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },

  // ── الملفات (Files / Master Data) ──

  AREAS: {
    BASE: '/areas',
    BY_ID: (id: string) => `/areas/${id}`,
  },

  MACHINES: {
    BASE: '/machines',
    BY_ID: (id: string) => `/machines/${id}`,
  },

  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
  },

  SUPPLIERS: {
    BASE: '/suppliers',
    BY_ID: (id: string) => `/suppliers/${id}`,
  },

  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string) => `/employees/${id}`,
  },

  INVENTORY: {
    BASE: '/inventory',
    BY_ID: (id: string) => `/inventory/${id}`,
  },

  TOOLS: {
    BASE: '/tools',
    BY_ID: (id: string) => `/tools/${id}`,
  },

  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}`,
  },

  // ── المهام (Tasks) ──

  MACHINE_RECEPTION: {
    BASE: '/tasks/machine-reception',
    BY_ID: (id: string) => `/tasks/machine-reception/${id}`,
    START: (id: string) => `/tasks/machine-reception/${id}/start`,
    PAUSE: (id: string) => `/tasks/machine-reception/${id}/pause`,
    RESUME: (id: string) => `/tasks/machine-reception/${id}/resume`,
    FINISH: (id: string) => `/tasks/machine-reception/${id}/finish`,
  },

  MACHINE_DELIVERY: {
    BASE: '/tasks/machine-delivery',
    BY_ID: (id: string) => `/tasks/machine-delivery/${id}`,
  },

  MACHINE_INSPECTION: {
    BASE: '/tasks/machine-inspection',
    BY_ID: (id: string) => `/tasks/machine-inspection/${id}`,
    START: (id: string) => `/tasks/machine-inspection/${id}/start`,
    PAUSE: (id: string) => `/tasks/machine-inspection/${id}/pause`,
    RESUME: (id: string) => `/tasks/machine-inspection/${id}/resume`,
    FINISH: (id: string) => `/tasks/machine-inspection/${id}/finish`,
  },

  MACHINE_MAINTENANCE: {
    BASE: '/tasks/machine-maintenance',
    BY_ID: (id: string) => `/tasks/machine-maintenance/${id}`,
    START: (id: string) => `/tasks/machine-maintenance/${id}/start`,
    PAUSE: (id: string) => `/tasks/machine-maintenance/${id}/pause`,
    RESUME: (id: string) => `/tasks/machine-maintenance/${id}/resume`,
    FINISH: (id: string) => `/tasks/machine-maintenance/${id}/finish`,
  },

  MACHINE_INSTALLATION: {
    BASE: '/tasks/machine-installation',
    BY_ID: (id: string) => `/tasks/machine-installation/${id}`,
    START: (id: string) => `/tasks/machine-installation/${id}/start`,
    PAUSE: (id: string) => `/tasks/machine-installation/${id}/pause`,
    RESUME: (id: string) => `/tasks/machine-installation/${id}/resume`,
    FINISH: (id: string) => `/tasks/machine-installation/${id}/finish`,
  },

  MACHINE_PRODUCTION: {
    BASE: '/tasks/machine-production',
    BY_ID: (id: string) => `/tasks/machine-production/${id}`,
    START: (id: string) => `/tasks/machine-production/${id}/start`,
    PAUSE: (id: string) => `/tasks/machine-production/${id}/pause`,
    RESUME: (id: string) => `/tasks/machine-production/${id}/resume`,
    FINISH: (id: string) => `/tasks/machine-production/${id}/finish`,
  },

  TRANSPORT: {
    BASE: '/tasks/transport',
    BY_ID: (id: string) => `/tasks/transport/${id}`,
    START: (id: string) => `/tasks/transport/${id}/start`,
    PAUSE: (id: string) => `/tasks/transport/${id}/pause`,
    RESUME: (id: string) => `/tasks/transport/${id}/resume`,
    FINISH: (id: string) => `/tasks/transport/${id}/finish`,
  },

  CUSTOMER_CALL: {
    BASE: '/tasks/customer-call',
    BY_ID: (id: string) => `/tasks/customer-call/${id}`,
  },

  MAINTENANCE_SCHEDULE: {
    BASE: '/tasks/maintenance-schedule',
    BY_ID: (id: string) => `/tasks/maintenance-schedule/${id}`,
    RESCHEDULE: (id: string) => `/tasks/maintenance-schedule/${id}/reschedule`,
    CANCEL: (id: string) => `/tasks/maintenance-schedule/${id}/cancel`,
  },

  // ── المحاسبة (Accounting) ──

  FINANCIAL_DOCUMENTS: {
    BASE: '/accounting/financial-documents',
    BY_ID: (id: string) => `/accounting/financial-documents/${id}`,
    BY_CUSTOMER: (id: string) => `/accounting/financial-documents/by-customer/${id}`,
    BY_SUPPLIER: (id: string) => `/accounting/financial-documents/by-supplier/${id}`,
    BY_TECHNICIAN: (id: string) => `/accounting/financial-documents/by-technician/${id}`,
  },

  PURCHASE_ORDERS: {
    BASE: '/accounting/purchase-orders',
    BY_ID: (id: string) => `/accounting/purchase-orders/${id}`,
    APPROVE: (id: string) => `/accounting/purchase-orders/${id}/approve`,
  },

  // ── Legacy (kept for backward compat) ──

  MAINTENANCE: {
    TASKS: '/maintenance/tasks',
    TASK_BY_ID: (id: string) => `/maintenance/tasks/${id}`,
    CALENDAR: '/maintenance/tasks/calendar',
    ASSIGN: (id: string) => `/maintenance/tasks/${id}/assign`,
    CANCEL: (id: string) => `/maintenance/tasks/${id}/cancel`,
    START: (id: string) => `/maintenance/tasks/${id}/start`,
    PAUSE: (id: string) => `/maintenance/tasks/${id}/pause`,
    RESUME: (id: string) => `/maintenance/tasks/${id}/resume`,
    FINISH: (id: string) => `/maintenance/tasks/${id}/finish`,
    MY_TASKS: '/maintenance/my-tasks',
    MY_ACTIVE_TASKS: '/maintenance/my-tasks/active',
    MY_STATUS: '/maintenance/my-status',
    STATS: '/maintenance/stats',
    TECHNICIANS: '/maintenance/technicians',
  },

  MACHINE_TYPES: {
    BASE: '/machine-types',
    BY_ID: (id: string) => `/machine-types/${id}`,
  },

  SERVICE_ORDERS: {
    BASE: '/service-orders',
    BY_ID: (id: string) => `/service-orders/${id}`,
    STATS: '/service-orders/stats',
    ASSIGN: (id: string) => `/service-orders/${id}/assign`,
    DELIVER: (id: string) => `/service-orders/${id}/deliver`,
    START: (id: string) => `/service-orders/${id}/start`,
    PAUSE: (id: string) => `/service-orders/${id}/pause`,
    RESUME: (id: string) => `/service-orders/${id}/resume`,
    COMPLETE: (id: string) => `/service-orders/${id}/complete`,
    MY_ORDERS: '/service-orders/my-orders',
    MY_ACTIVE_ORDERS: '/service-orders/my-orders/active',
    REPORT_BY_MACHINE: '/service-orders/reports/by-machine-type',
    REPORT_BY_TECHNICIAN: '/service-orders/reports/by-technician',
    REPORT_BY_CUSTOMER: '/service-orders/reports/by-customer',
  },
} as const;
