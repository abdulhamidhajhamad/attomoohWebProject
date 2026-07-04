import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineReception,
  MachineReceptionSchema,
} from './schemas/machine-reception.schema.js';
import {
  MachineInspection,
  MachineInspectionSchema,
} from '../machine-inspection/schemas/machine-inspection.schema.js';
import {
  MachineMaint,
  MachineMaintSchema,
} from '../machine-maintenance/schemas/machine-maint.schema.js';
import {
  MachineInstallation,
  MachineInstallationSchema,
} from '../machine-installation/schemas/machine-installation.schema.js';
import {
  MachineProduction,
  MachineProductionSchema,
} from '../machine-production/schemas/machine-production.schema.js';
import { MachineReceptionRepository } from './repositories/machine-reception.repository.js';
import { MachineReceptionService } from './machine-reception.service.js';
import { MachineReceptionController } from './machine-reception.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MachineReception.name, schema: MachineReceptionSchema },
      { name: MachineInspection.name, schema: MachineInspectionSchema },
      { name: MachineMaint.name, schema: MachineMaintSchema },
      { name: MachineInstallation.name, schema: MachineInstallationSchema },
      { name: MachineProduction.name, schema: MachineProductionSchema },
    ]),
  ],
  controllers: [MachineReceptionController],
  providers: [MachineReceptionService, MachineReceptionRepository],
  exports: [MachineReceptionService],
})
export class MachineReceptionModule {}
