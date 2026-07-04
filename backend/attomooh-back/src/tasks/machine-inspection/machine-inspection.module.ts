import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineInspection,
  MachineInspectionSchema,
} from './schemas/machine-inspection.schema.js';
import { MachineInspectionRepository } from './repositories/machine-inspection.repository.js';
import { MachineInspectionService } from './machine-inspection.service.js';
import { MachineInspectionController } from './machine-inspection.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MachineInspection.name, schema: MachineInspectionSchema },
    ]),
  ],
  controllers: [MachineInspectionController],
  providers: [MachineInspectionService, MachineInspectionRepository],
  exports: [MachineInspectionService],
})
export class MachineInspectionModule {}
