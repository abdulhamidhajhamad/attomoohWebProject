export { authService } from './auth.service';
export { categoriesService } from './categories.service';
export { productsService } from './products.service';
export { maintenanceService } from './maintenance.service';
export { customersService } from './customers.service';
export { machineTypesService } from './machineTypes.service';
export { serviceOrdersService } from './serviceOrders.service';

// الملفات (Master Data)
export { areasService } from './areas.service';
export { machinesService } from './machines.service';
export { suppliersService } from './suppliers.service';
export { employeesService } from './employees.service';
export { inventoryService } from './inventory.service';
export { toolsService } from './tools.service';
export { vehiclesService } from './vehicles.service';

// المهام (Tasks)
export { machineReceptionService } from './machineReception.service';
export { machineDeliveryService } from './machineDelivery.service';
export { machineInspectionService } from './machineInspection.service';
export { machineMaintenanceService } from './machineMaintenance.service';
export { machineInstallationService } from './machineInstallation.service';
export { machineProductionService } from './machineProduction.service';
export { transportService } from './transport.service';
export { customerCallService } from './customerCall.service';
export { maintenanceScheduleService } from './maintenanceSchedule.service';

// مهام الفني الموحدة (Unified Technician Tasks)
export { technicianTasksService, type UnifiedTask, type TaskType, type TaskReportPayload } from './technicianTasks.service';

// المحاسبة (Accounting)
export { financialDocumentsService } from './financialDocuments.service';
export { purchaseOrdersService } from './purchaseOrders.service';
