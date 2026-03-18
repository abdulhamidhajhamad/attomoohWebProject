import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MachineDelivery, MachineDeliverySchema } from './schemas/machine-delivery.schema.js';
import { MachineDeliveryRepository } from './repositories/machine-delivery.repository.js';
import { MachineDeliveryService } from './machine-delivery.service.js';
import { MachineDeliveryController } from './machine-delivery.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: MachineDelivery.name, schema: MachineDeliverySchema }])],
  controllers: [MachineDeliveryController],
  providers: [MachineDeliveryService, MachineDeliveryRepository],
  exports: [MachineDeliveryService],
})
export class MachineDeliveryModule {}
