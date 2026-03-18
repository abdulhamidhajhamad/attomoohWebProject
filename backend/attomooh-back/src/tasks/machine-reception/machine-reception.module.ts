import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MachineReception, MachineReceptionSchema } from './schemas/machine-reception.schema.js';
import { MachineReceptionRepository } from './repositories/machine-reception.repository.js';
import { MachineReceptionService } from './machine-reception.service.js';
import { MachineReceptionController } from './machine-reception.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: MachineReception.name, schema: MachineReceptionSchema }])],
  controllers: [MachineReceptionController],
  providers: [MachineReceptionService, MachineReceptionRepository],
  exports: [MachineReceptionService],
})
export class MachineReceptionModule {}
