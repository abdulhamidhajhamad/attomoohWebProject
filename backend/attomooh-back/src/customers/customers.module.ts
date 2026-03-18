import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schemas/customer.schema.js';
import { CustomerRepository } from './repositories/customer.repository.js';
import { CustomersService } from './customers.service.js';
import { CustomersController } from './customers.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerRepository],
  exports: [CustomersService],
})
export class CustomersModule {}
