import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Machine, MachineSchema } from './schemas/machine.schema.js';
import { MachineRepository } from './repositories/machine.repository.js';
import { MachinesService } from './machines.service.js';
import { MachinesController } from './machines.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Machine.name, schema: MachineSchema }]),
  ],
  controllers: [MachinesController],
  providers: [MachinesService, MachineRepository],
  exports: [MachinesService],
})
export class MachinesModule {}
