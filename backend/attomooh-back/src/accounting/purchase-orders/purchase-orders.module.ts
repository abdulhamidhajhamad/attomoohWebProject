import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema.js';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { PurchaseOrdersController } from './purchase-orders.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
    ]),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrderRepository],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
