import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineProduction,
  MachineProductionSchema,
} from './schemas/machine-production.schema.js';
import { MachineProductionRepository } from './repositories/machine-production.repository.js';
import { MachineProductionService } from './machine-production.service.js';
import { MachineProductionController } from './machine-production.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MachineProduction.name,
        schema: MachineProductionSchema,
      },
    ]),
  ],
  controllers: [MachineProductionController],
  providers: [MachineProductionService, MachineProductionRepository],
  exports: [MachineProductionService],
})
export class MachineProductionModule {}
