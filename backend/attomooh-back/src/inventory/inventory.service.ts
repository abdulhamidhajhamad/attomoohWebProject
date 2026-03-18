import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { InventoryItemRepository } from './repositories/inventory-item.repository.js';
import { InventoryItemDocument } from './schemas/inventory-item.schema.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class InventoryService {
  constructor(private readonly repo: InventoryItemRepository, private readonly idGen: IdGeneratorService) {}

  async create(dto: CreateInventoryItemDto): Promise<InventoryItemDocument> {
    const customId = dto.customId || (await this.idGen.generateId(IdPrefix.INVENTORY));
    return this.repo.create({
      customId, name: dto.name, purchasePrice: dto.purchasePrice ?? 0,
      sellingPrice: dto.sellingPrice ?? 0, quantity: dto.quantity ?? 0,
      location: dto.location ?? '', notes: dto.notes ?? '', isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<InventoryItemDocument[]> { return this.repo.findAll(); }
  async findById(id: Types.ObjectId): Promise<InventoryItemDocument> { const doc = await this.repo.findById(id); if (!doc) throw new NotFoundException('Inventory item not found'); return doc; }
  async search(query: string): Promise<InventoryItemDocument[]> { return this.repo.search(query); }
  async update(id: Types.ObjectId, dto: UpdateInventoryItemDto): Promise<InventoryItemDocument> { const updated = await this.repo.updateById(id, dto); if (!updated) throw new NotFoundException('Inventory item not found'); return updated; }
  async delete(id: Types.ObjectId): Promise<void> { const deleted = await this.repo.deleteById(id); if (!deleted) throw new NotFoundException('Inventory item not found'); }
}
