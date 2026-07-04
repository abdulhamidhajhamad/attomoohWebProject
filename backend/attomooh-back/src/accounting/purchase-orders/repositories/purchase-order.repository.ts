import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from '../schemas/purchase-order.schema.js';

@Injectable()
export class PurchaseOrderRepository {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly model: Model<PurchaseOrderDocument>,
  ) {}

  async create(data: Partial<PurchaseOrder>): Promise<PurchaseOrderDocument> {
    return new this.model(data).save();
  }

  async findById(id: Types.ObjectId): Promise<PurchaseOrderDocument | null> {
    return this.model
      .findById(id)
      .populate('requestedBy', 'name phone')
      .populate('machine')
      .populate('supplier')
      .exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<PurchaseOrderDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name phone')
      .populate('machine')
      .populate('supplier')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<PurchaseOrder>,
  ): Promise<PurchaseOrderDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<PurchaseOrderDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
