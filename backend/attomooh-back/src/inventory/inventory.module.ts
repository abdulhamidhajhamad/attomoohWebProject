import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InventoryItem,
  InventoryItemSchema,
} from './schemas/inventory-item.schema.js';
import { InventoryItemRepository } from './repositories/inventory-item.repository.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryItemRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
