import { Module } from '@nestjs/common';
import { TechnicianTasksController } from './technician-tasks.controller.js';
import { TechnicianTasksService } from './technician-tasks.service.js';
import { MachineInspectionModule } from '../tasks/machine-inspection/machine-inspection.module.js';
import { MachineMaintModule } from '../tasks/machine-maintenance/machine-maint.module.js';
import { MachineInstallationModule } from '../tasks/machine-installation/machine-installation.module.js';
import { MachineProductionModule } from '../tasks/machine-production/machine-production.module.js';

@Module({
  imports: [
    MachineInspectionModule,
    MachineMaintModule,
    MachineInstallationModule,
    MachineProductionModule,
  ],
  controllers: [TechnicianTasksController],
  providers: [TechnicianTasksService],
  exports: [TechnicianTasksService],
})
export class TechnicianTasksModule {}
