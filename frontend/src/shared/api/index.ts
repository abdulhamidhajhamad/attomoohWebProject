/**
 * API Layer — Public API (Facade Pattern)
 *
 * استورد من هنا فقط — لا حاجة للوصول للملفات الداخلية
 *
 * import { productsService, categoriesService, authService } from '@/shared/api';
 * import { API_BASE_URL } from '@/shared/api';
 * import type { ApiProduct, LoginRequest } from '@/shared/api';
 */

// ── Config ──
export { API_BASE_URL, API_CONFIG } from './config';

// ── Endpoints ──
export { ENDPOINTS } from './endpoints';

// ── HTTP Client ──
export { httpClient, ApiError, getStoredToken } from './httpClient';

// ── Services ──
export {
  authService,
  categoriesService,
  productsService,
  maintenanceService,
} from './services';

// ── Types ──
export type {
  ApiProduct,
  ApiProductImage,
  ApiCategory,
  ApiUser,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  CreateCategoryRequest,
  CreateProductPayload,
  UpdateProductPayload,
  // Maintenance types
  ApiMaintenanceTask,
  ApiMaintenanceStats,
  ApiTechnician,
  ApiTaskStatus,
  ApiTaskPriority,
  ApiTechnicianStatus,
  ApiTimeLog,
  ApiUsedPart,
  ApiTaskReport,
  CreateTaskRequest,
  AssignTaskRequest,
  TaskReportRequest,
  UpdateTaskRequest,
} from './types';

// ── Mappers ──
export {
  mapApiProduct,
  mapApiCategory,
  mapApiProducts,
  mapApiCategories,
} from './mappers';
