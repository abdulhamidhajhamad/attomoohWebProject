import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceSchedule, MaintenanceScheduleSchema } from './schemas/maintenance-schedule.schema.js';
import { MaintenanceScheduleRepository } from './repositories/maintenance-schedule.repository.js';
import { MaintenanceScheduleService } from './maintenance-schedule.service.js';
import { MaintenanceScheduleController } from './maintenance-schedule.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: MaintenanceSchedule.name, schema: MaintenanceScheduleSchema }])],
  controllers: [MaintenanceScheduleController],
  providers: [MaintenanceScheduleService, MaintenanceScheduleRepository],
  exports: [MaintenanceScheduleService],
})
export class MaintenanceScheduleModule {}
