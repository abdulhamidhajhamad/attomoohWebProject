import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineInstallation,
  MachineInstallationSchema,
} from './schemas/machine-installation.schema.js';
import { MachineInstallationRepository } from './repositories/machine-installation.repository.js';
import { MachineInstallationService } from './machine-installation.service.js';
import { MachineInstallationController } from './machine-installation.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MachineInstallation.name,
        schema: MachineInstallationSchema,
      },
    ]),
  ],
  controllers: [MachineInstallationController],
  providers: [MachineInstallationService, MachineInstallationRepository],
  exports: [MachineInstallationService],
})
export class MachineInstallationModule {}
