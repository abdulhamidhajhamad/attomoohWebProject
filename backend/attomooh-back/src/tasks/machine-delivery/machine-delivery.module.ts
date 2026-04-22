import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MachineDelivery, MachineDeliverySchema } from './schemas/machine-delivery.schema.js';
import { MachineReception, MachineReceptionSchema } from '../machine-reception/schemas/machine-reception.schema.js';
import { MachineInspection, MachineInspectionSchema } from '../machine-inspection/schemas/machine-inspection.schema.js';
import { MachineMaint, MachineMaintSchema } from '../machine-maintenance/schemas/machine-maint.schema.js';
import { MachineInstallation, MachineInstallationSchema } from '../machine-installation/schemas/machine-installation.schema.js';
import { MachineProduction, MachineProductionSchema } from '../machine-production/schemas/machine-production.schema.js';
import { MachineDeliveryRepository } from './repositories/machine-delivery.repository.js';
import { MachineDeliveryService } from './machine-delivery.service.js';
import { MachineDeliveryController } from './machine-delivery.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MachineDelivery.name, schema: MachineDeliverySchema },
      { name: MachineReception.name, schema: MachineReceptionSchema },
      { name: MachineInspection.name, schema: MachineInspectionSchema },
      { name: MachineMaint.name, schema: MachineMaintSchema },
      { name: MachineInstallation.name, schema: MachineInstallationSchema },
      { name: MachineProduction.name, schema: MachineProductionSchema },
    ]),
  ],
  controllers: [MachineDeliveryController],
  providers: [MachineDeliveryService, MachineDeliveryRepository],
  exports: [MachineDeliveryService],
})
export class MachineDeliveryModule {}
