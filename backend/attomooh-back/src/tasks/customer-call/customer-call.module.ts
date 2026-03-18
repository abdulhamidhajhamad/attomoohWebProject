import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerCall, CustomerCallSchema } from './schemas/customer-call.schema.js';
import { CustomerCallRepository } from './repositories/customer-call.repository.js';
import { CustomerCallService } from './customer-call.service.js';
import { CustomerCallController } from './customer-call.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: CustomerCall.name, schema: CustomerCallSchema }])],
  controllers: [CustomerCallController],
  providers: [CustomerCallService, CustomerCallRepository],
  exports: [CustomerCallService],
})
export class CustomerCallModule {}
