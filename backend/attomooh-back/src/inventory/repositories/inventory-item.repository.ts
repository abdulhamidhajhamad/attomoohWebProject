import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InventoryItem,
  InventoryItemDocument,
} from '../schemas/inventory-item.schema.js';
import { escapeRegex } from '../../common/utils/regex.js';

@Injectable()
export class InventoryItemRepository {
  constructor(
    @InjectModel(InventoryItem.name)
    private readonly model: Model<InventoryItemDocument>,
  ) {}

  async create(data: Partial<InventoryItem>): Promise<InventoryItemDocument> {
    return new this.model(data).save();
  }
  async findById(id: Types.ObjectId): Promise<InventoryItemDocument | null> {
    return this.model.findById(id).exec();
  }
  async findAll(): Promise<InventoryItemDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }
  async search(query: string): Promise<InventoryItemDocument[]> {
    const regex = new RegExp(escapeRegex(query), 'i');
    return this.model
      .find({ $or: [{ name: regex }, { customId: regex }] })
      .sort({ name: 1 })
      .exec();
  }
  async updateById(
    id: Types.ObjectId,
    data: Partial<InventoryItem>,
  ): Promise<InventoryItemDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }
  async deleteById(id: Types.ObjectId): Promise<InventoryItemDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
