import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Counter,
  CounterSchema,
} from '../service-orders/schemas/counter.schema.js';
import { IdGeneratorService } from './services/id-generator.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
  ],
  providers: [IdGeneratorService],
  exports: [IdGeneratorService, MongooseModule],
})
export class CommonModule {}
