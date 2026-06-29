/**
 * API Types — Match backend schemas exactly
 *
 * هذه الأنواع تطابق ما يرجعه الباك اند (NestJS) تماماً
 * لا تعدّلها إلا إذا تغيّر الباك اند
 */

/* ═══════════════════════════════════
   Product
   ═══════════════════════════════════ */

export interface ApiProductImage {
  publicId: string;
  secureUrl: string;
  isCover: boolean;
}

export interface ApiProduct {
  _id: string;
  name: { ar: string; en: string };
  brand: string;
  model: string;
  price: number;
  categories: (string | ApiCategory)[];
  specifications: Record<string, unknown>;
  images: ApiProductImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Category
   ═══════════════════════════════════ */

export interface ApiCategory {
  _id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: string;
  image: string;
  parents: string[];
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Tree node returned by GET /categories/tree */
export interface ApiCategoryTreeNode extends ApiCategory {
  children: ApiCategoryTreeNode[];
}

/* ═══════════════════════════════════
   User
   ═══════════════════════════════════ */

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
  phone: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Area
   ═══════════════════════════════════ */

export interface ApiArea {
  _id: string;
  customId: string;
  name: string;
  phonePrefix: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Auth
   ═══════════════════════════════════ */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
}

/* ═══════════════════════════════════
   Maintenance Types (API)
   ═══════════════════════════════════ */

export type ApiTaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ApiTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ApiTechnicianStatus = 'available' | 'on_task' | 'off_duty';

export interface ApiTimeLog {
  action: 'start' | 'pause' | 'resume' | 'finish';
  timestamp: string;
}

export interface ApiUsedPart {
  name: string;
  quantity: number;
  cost: number;
}

export interface ApiTaskReport {
  problemDescription: string;
  solutionDescription: string;
  usedParts: ApiUsedPart[];
  laborCost: number;
  notes: string;
}

export interface ApiMaintenanceTask {
  _id: string;
  title: string;
  description: string;
  machineInfo: string;
  location: string;
  priority: ApiTaskPriority;
  status: ApiTaskStatus;
  createdBy: ApiUser | string;
  assignedTo: ApiTechnician | string | null;
  serviceOrder: ApiServiceOrder | string | null;
  timeLogs: ApiTimeLog[];
  totalDurationMs: number;
  report: ApiTaskReport;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTechnician extends ApiUser {
  technicianStatus: ApiTechnicianStatus;
}

export interface ApiMaintenanceStats {
  byStatus: Record<string, number>;
  total: number;
}

/** Create task request */
export interface CreateTaskRequest {
  serviceOrder?: string;
  title?: string;
  description?: string;
  machineInfo?: string;
  location?: string;
  priority?: ApiTaskPriority;
  assignedTo?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

/** Assign task request */
export interface AssignTaskRequest {
  technicianId: string;
}

/** Task report request (when finishing) */
export interface TaskReportRequest {
  problemDescription?: string;
  solutionDescription?: string;
  usedParts?: { name: string; quantity: number; cost?: number }[];
  laborCost?: number;
  notes?: string;
}

/** Update task request */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  machineInfo?: string;
  location?: string;
  priority?: ApiTaskPriority;
  assignedTo?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

/* ═══════════════════════════════════
   Create / Update DTOs
   ═══════════════════════════════════ */

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  imageFile?: File;
  /** Send zero, one, or more parent IDs (same level). */
  parentIds?: string[];
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  imageFile?: File;
  /** Send empty array to make root, or one/more parent IDs to assign parents. */
  parentIds?: string[];
  isActive?: boolean;
}

/** Form data for creating a product (sent as multipart/form-data) */
export interface CreateProductPayload {
  name: string;
  brand: string;
  model: string;
  price: number;
  categories: string[];
  specifications?: Record<string, string>;
  images: File[];
  isActive?: boolean;
}

/** Form data for updating a product */
export interface UpdateProductPayload {
  name?: string;
  brand?: string;
  model?: string;
  price?: number;
  categories?: string[];
  specifications?: Record<string, string>;
  images?: File[];
  isActive?: boolean;
  /** URLs of existing images to keep (all others are deleted from Cloudinary) */
  existingImages?: string[];
}

/* ═══════════════════════════════════
   Customer
   ═══════════════════════════════════ */

export interface ApiCustomer {
  _id: string;
  customId: string;
  name: string;
  phone: string;
  area: ApiArea | string | null;
  address: string;
  notes: string;
  technician1: ApiTechnician | string | null;
  technician1Name: string;
  technician2: ApiTechnician | string | null;
  technician2Name: string;
  technician3: ApiTechnician | string | null;
  technician3Name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  area?: string;
  address?: string;
  notes?: string;
  technician1?: string;
  technician1Name?: string;
  technician2?: string;
  technician2Name?: string;
  technician3?: string;
  technician3Name?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  area?: string;
  address?: string;
  notes?: string;
  technician1?: string;
  technician1Name?: string;
  technician2?: string;
  technician2Name?: string;
  technician3?: string;
  technician3Name?: string;
}

/* ═══════════════════════════════════
   Machine Type
   ═══════════════════════════════════ */

export interface ApiMachineType {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateMachineTypeRequest {
  name?: string;
  description?: string;
}

/* ═══════════════════════════════════
   Service Order
   ═══════════════════════════════════ */

export type ApiServiceOrderStatus =
  | 'waiting'
  | 'in_maintenance'
  | 'postponed'
  | 'ready'
  | 'delivered';

export type ApiMachineCondition = 'complete' | 'incomplete';

export interface ApiSparePart {
  name: string;
  quantity: number;
  cost: number;
}

export interface ApiCompletionReport {
  completedAt: string | null;
  technicianReport: string;
  durationMs: number;
  spareParts: ApiSparePart[];
  maintenanceFee: number;
  totalCost: number;
  notes: string;
}

export interface ApiServiceOrder {
  _id: string;
  formNumber: number;
  machineType: ApiMachineType | string | null;
  machineDetails: string;
  serialNumber: string;
  customer: ApiCustomer | string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string;
  warranty: boolean;
  receptionDate: string;
  expectedDeliveryDate: string | null;
  condition: ApiMachineCondition;
  customerProblemDesc: string;
  status: ApiServiceOrderStatus;
  assignedTo: ApiTechnician | string | null;
  createdBy: ApiUser | string;
  timeLogs: ApiTimeLog[];
  totalDurationMs: number;
  completionReport: ApiCompletionReport;
  deliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceOrderRequest {
  machineType?: string;
  machineDetails?: string;
  serialNumber?: string;
  customer?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNotes?: string;
  warranty?: boolean;
  expectedDeliveryDate?: string;
  condition?: ApiMachineCondition;
  customerProblemDesc?: string;
}

export interface UpdateServiceOrderRequest {
  machineType?: string;
  machineDetails?: string;
  serialNumber?: string;
  customer?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNotes?: string;
  warranty?: boolean;
  expectedDeliveryDate?: string;
  condition?: ApiMachineCondition;
  customerProblemDesc?: string;
  status?: ApiServiceOrderStatus;
}

export interface CompleteServiceOrderRequest {
  technicianReport?: string;
  spareParts?: { name: string; quantity: number; cost?: number }[];
  maintenanceFee?: number;
  notes?: string;
}

export interface AssignServiceOrderRequest {
  technicianId: string;
}

/* ═══════════════════════════════════
   Reports
   ═══════════════════════════════════ */

export interface ReportByMachineType {
  _id?: string;
  machineTypeId: string;
  machineTypeName: string;
  count: number;
  technicianTotalCost: number;
  companyTotalCost: number;
}

export interface ReportByTechnician {
  _id?: string;
  technicianId: string;
  technicianName: string;
  count: number;
  completed: number;
  technicianTotalCost: number;
  companyTotalCost: number;
  customId?: string;
  phone?: string;
  email?: string | null;
  technicianStatus?: ApiTechnicianStatus;
  isActive?: boolean;
}

export type ApiTechnicianTaskType =
  | 'inspection'
  | 'maintenance'
  | 'installation'
  | 'production';

export interface ApiTechnicianTaskDetails {
  _id: string;
  taskType: ApiTechnicianTaskType;
  machineName: string;
  machineDetails: string;
  status: string;
  technicianName: string;
  technicianFee: number;
  companyFee: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  machineReception: ApiMachineReception | string | null;
}

export interface ReportByCustomer {
  _id?: string;
  customerId: string;
  customerName: string;
  count: number;
}

/* ═══════════════════════════════════
   Employee
   ═══════════════════════════════════ */

export type ApiEmployeeCategory = 'permanent' | 'partial' | 'temporary' | 'external';

export interface ApiEmployee {
  _id: string;
  customId: string;
  name: string;
  phone: string;
  jobTitle: string;
  category: ApiEmployeeCategory;
  area: ApiArea | string | null;
  address: string;
  notes: string;
  email: string | null;
  role: 'admin' | 'user' | 'technician' | null;
  technicianStatus: ApiTechnicianStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  phone?: string;
  jobTitle?: string;
  category?: ApiEmployeeCategory;
  area?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  /** Optional: grant system access by creating a user */
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | 'technician';
}

export interface UpdateEmployeeRequest {
  name?: string;
  phone?: string;
  jobTitle?: string;
  category?: ApiEmployeeCategory;
  area?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  email?: string | null;
  password?: string;
  role?: 'admin' | 'user' | 'technician' | null;
  technicianStatus?: ApiTechnicianStatus;
}

/* ═══════════════════════════════════
   Machine (إدارة الآلات)
   ═══════════════════════════════════ */

export interface ApiMachine {
  _id: string;
  customId: string;
  name: string;
  technician1: ApiTechnician | string | null;
  technician1Name: string;
  technician2: ApiTechnician | string | null;
  technician2Name: string;
  technician3: ApiTechnician | string | null;
  technician3Name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Tool (إدارة العدد)
   ═══════════════════════════════════ */

export interface ApiTool {
  _id: string;
  customId: string;
  name: string;
  quantity: number;
  responsibleTechnician: ApiTechnician | string | null;
  responsibleTechnicianName: string;
  location: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Supplier (إدارة الموردين)
   ═══════════════════════════════════ */

export interface ApiSupplier {
  _id: string;
  customId: string;
  name: string;
  phone: string;
  area: ApiArea | string | null;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Vehicle (إدارة المركبات)
   ═══════════════════════════════════ */

export interface ApiVehicle {
  _id: string;
  customId: string;
  brandAndModel: string;
  plateNumber: string;
  responsiblePerson: string;
  responsibleUser: ApiEmployee | string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Reception (استلام الآلات)
   ═══════════════════════════════════ */

export type ApiReceptionStatus = 'waiting' | 'in_maintenance' | 'postponed' | 'ready' | 'rejected' | 'delivered';

export interface ApiMachineReception {
  _id: string;
  customId: string;
  machine: ApiMachine | string | null;
  machineDetails: string;
  serialNumber: string;
  customer: ApiCustomer | string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  warranty: boolean;
  receptionDate: string;
  expectedDeliveryDate: string | null;
  condition: ApiMachineCondition;
  receivedParts: string;
  customerProblemDesc: string;
  notes: string;
  receivedBy: ApiEmployee | string | null;
  receivedByName: string;
  status: ApiReceptionStatus;
  assignedTo: ApiEmployee | string | null;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Delivery (تسليم الآلات)
   ═══════════════════════════════════ */

export interface ApiMachineDelivery {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  customerName: string;
  deliveryDate: string;
  notes: string;
  deliveredBy: ApiEmployee | string | null;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Inspection (فحص الآلات)
   ═══════════════════════════════════ */

export type ApiInspectionStatus = 'assigned' | 'in_progress' | 'postponed' | 'ready' | 'rejected';

export interface ApiInspectionSparePart {
  name: string;
  quantity: number;
  cost: number;
}

export interface ApiMachineInspection {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  technician: ApiEmployee | string | null;
  technicianName: string;
  spareParts: ApiInspectionSparePart[];
  technicianReport: string;
  readyForDelivery: boolean;
  inspectionDurationMs: number;
  status: ApiInspectionStatus;
  technicianFee: number;
  companyFee: number;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Maintenance (صيانة الآلات)
   ═══════════════════════════════════ */

export type ApiMaintenanceStatus = 'waiting' | 'assigned' | 'in_maintenance' | 'postponed' | 'ready' | 'rejected';

export interface ApiMachineMaint {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  technician: ApiEmployee | string | null;
  technicianName: string;
  spareParts: ApiInspectionSparePart[];
  technicianReport: string;
  readyForDelivery: boolean;
  maintenanceDurationMs: number;
  status: ApiMaintenanceStatus;
  technicianFee: number;
  companyFee: number;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Installation (تنصيب الآلات)
   ═══════════════════════════════════ */

export type ApiInstallationStatus = 'assigned' | 'in_progress' | 'postponed' | 'ready' | 'rejected';

export interface ApiMachineInstallation {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  technician: ApiEmployee | string | null;
  technicianName: string;
  technicianReport: string;
  installationDurationMs: number;
  status: ApiInstallationStatus;
  technicianFee: number;
  companyFee: number;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Machine Production (إنتاج الآلات)
   ═══════════════════════════════════ */

export interface ApiMachineProduction {
  _id: string;
  customId: string;
  machineReception: ApiMachineReception | string | null;
  machineName: string;
  machineDetails: string;
  machineNameAndDetails: string;
  date: string;
  pauseReason: string;
  technician: ApiEmployee | string | null;
  technicianName: string;
  productionDurationMs: number;
  materialsAndParts: ApiInspectionSparePart[];
  readyForDelivery: boolean;
  technicianFee: number;
  companyFee: number;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  rejectionReason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Transport (النقل)
   ═══════════════════════════════════ */

export interface ApiTransport {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  logistic: ApiEmployee | string | null;
  logisticName: string;
  logisticReport: string;
  transportDurationMs: number;
  readyForDelivery: boolean;
  logisticFee: number;
  companyFee: number;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Customer Call (الاتصال الهاتفي)
   ═══════════════════════════════════ */

export interface ApiCustomerCall {
  _id: string;
  customer: ApiCustomer | string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  machine: ApiMachine | string | null;
  machineName: string;
  machineDetails: string;
  warranty: boolean;
  date: string;
  time: string;
  customerProblemDesc: string;
  solution: string;
  notes: string;
  receivedBy: ApiEmployee | string | null;
  receivedByName: string;
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════
   Maintenance Schedule (جدولة الصيانة)
   ═══════════════════════════════════ */

export type ApiScheduleStatus = 'scheduled' | 'rescheduled' | 'cancelled';

export interface ApiMaintenanceSchedule {
  _id: string;
  machineReception: ApiMachineReception | string;
  machineName: string;
  machineDetails: string;
  technician: ApiEmployee | string | null;
  technicianName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: ApiScheduleStatus;
  rescheduledTechnician: ApiEmployee | string | null;
  rescheduledTechnicianName: string;
  rescheduledDate: string | null;
  rescheduledTime: string;
  rescheduleReason: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}
