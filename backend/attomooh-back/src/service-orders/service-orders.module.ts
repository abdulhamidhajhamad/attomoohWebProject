import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ServiceOrder,
  ServiceOrderSchema,
} from './schemas/service-order.schema.js';
import { Counter, CounterSchema } from './schemas/counter.schema.js';
import { ServiceOrderRepository } from './repositories/service-order.repository.js';
import { CounterRepository } from './repositories/counter.repository.js';
import { ServiceOrdersService } from './service-orders.service.js';
import { ServiceOrdersController } from './service-orders.controller.js';
import { EmployeesModule } from '../employees/employees.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceOrder.name, schema: ServiceOrderSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    EmployeesModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, ServiceOrderRepository, CounterRepository],
  exports: [ServiceOrdersService, ServiceOrderRepository],
})
export class ServiceOrdersModule {}
