import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MachineMaint,
  MachineMaintSchema,
} from './schemas/machine-maint.schema.js';
import { MachineMaintRepository } from './repositories/machine-maint.repository.js';
import { MachineMaintService } from './machine-maint.service.js';
import { MachineMaintController } from './machine-maint.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MachineMaint.name, schema: MachineMaintSchema },
    ]),
  ],
  controllers: [MachineMaintController],
  providers: [MachineMaintService, MachineMaintRepository],
  exports: [MachineMaintService],
})
export class MachineMaintModule {}
