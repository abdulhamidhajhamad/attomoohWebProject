import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineType,
  MachineTypeSchema,
} from './schemas/machine-type.schema.js';
import { MachineTypeRepository } from './repositories/machine-type.repository.js';
import { MachineTypesService } from './machine-types.service.js';
import { MachineTypesController } from './machine-types.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MachineType.name, schema: MachineTypeSchema },
    ]),
  ],
  controllers: [MachineTypesController],
  providers: [MachineTypesService, MachineTypeRepository],
  exports: [MachineTypesService],
})
export class MachineTypesModule {}
