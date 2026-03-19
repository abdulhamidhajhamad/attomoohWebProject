import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MaintenanceTask,
  MaintenanceTaskSchema,
} from './schemas/maintenance-task.schema.js';
import { MaintenanceRepository } from './repositories/maintenance.repository.js';
import { MaintenanceService } from './maintenance.service.js';
import { MaintenanceController } from './maintenance.controller.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { ServiceOrdersModule } from '../service-orders/service-orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceTask.name, schema: MaintenanceTaskSchema },
    ]),
    EmployeesModule,
    ServiceOrdersModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
