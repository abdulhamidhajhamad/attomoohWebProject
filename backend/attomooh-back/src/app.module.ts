import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// ── Global Modules ──
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { CommonModule } from './common/common.module.js';

// ── Database & Seeders ──
import { DatabaseModule } from './database/database.module.js';

// ── Core Modules ──
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';

// ── Legacy Modules (kept for backward compat) ──
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { MachineTypesModule } from './machine-types/machine-types.module.js';
import { ServiceOrdersModule } from './service-orders/service-orders.module.js';

// ── الملفات (Master Data) ──
import { AreasModule } from './areas/areas.module.js';
import { MachinesModule } from './machines/machines.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { ToolsMgmtModule } from './tools-mgmt/tools-mgmt.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

// ── المهام (Tasks) ──
import { MachineReceptionModule } from './tasks/machine-reception/machine-reception.module.js';
import { MachineDeliveryModule } from './tasks/machine-delivery/machine-delivery.module.js';
import { MachineInspectionModule } from './tasks/machine-inspection/machine-inspection.module.js';
import { MachineMaintModule } from './tasks/machine-maintenance/machine-maint.module.js';
import { MachineInstallationModule } from './tasks/machine-installation/machine-installation.module.js';
import { MachineProductionModule } from './tasks/machine-production/machine-production.module.js';
import { TransportModule } from './tasks/transport/transport.module.js';
import { CustomerCallModule } from './tasks/customer-call/customer-call.module.js';
import { MaintenanceScheduleModule } from './tasks/maintenance-schedule/maintenance-schedule.module.js';

// ── Technician Tasks (Unified) ──
import { TechnicianTasksModule } from './technician-tasks/technician-tasks.module.js';

// ── المحاسبة (Accounting) ──
import { FinancialDocumentsModule } from './accounting/financial-documents/financial-documents.module.js';
import { PurchaseOrdersModule } from './accounting/purchase-orders/purchase-orders.module.js';

@Module({
  imports: [
    // ── Global Config ──
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── MongoDB Connection ──
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // ── Global Modules ──
    CloudinaryModule,
    CommonModule,

    // ── Database & Seeders ──
    DatabaseModule,

    // ── Core Modules ──
    AuthModule,
    CategoriesModule,
    ProductsModule,

    // ── Legacy Modules ──
    MaintenanceModule,
    MachineTypesModule,
    ServiceOrdersModule,

    // ── الملفات (Master Data) ──
    AreasModule,
    MachinesModule,
    CustomersModule,
    SuppliersModule,
    EmployeesModule,
    InventoryModule,
    ToolsMgmtModule,
    VehiclesModule,

    // ── المهام (Tasks) ──
    MachineReceptionModule,
    MachineDeliveryModule,
    MachineInspectionModule,
    MachineMaintModule,
    MachineInstallationModule,
    MachineProductionModule,
    TransportModule,
    CustomerCallModule,
    MaintenanceScheduleModule,

    // ── Technician Tasks (Unified) ──
    TechnicianTasksModule,

    // ── المحاسبة (Accounting) ──
    FinancialDocumentsModule,
    PurchaseOrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
