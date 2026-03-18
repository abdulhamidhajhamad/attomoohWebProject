import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Area, AreaSchema } from './schemas/area.schema.js';
import { AreaRepository } from './repositories/area.repository.js';
import { AreasService } from './areas.service.js';
import { AreasController } from './areas.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Area.name, schema: AreaSchema }]),
  ],
  controllers: [AreasController],
  providers: [AreasService, AreaRepository],
  exports: [AreasService],
})
export class AreasModule {}
