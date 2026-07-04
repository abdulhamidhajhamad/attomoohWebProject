import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CustomerCall,
  CustomerCallDocument,
} from '../schemas/customer-call.schema.js';

@Injectable()
export class CustomerCallRepository {
  constructor(
    @InjectModel(CustomerCall.name)
    private readonly model: Model<CustomerCallDocument>,
  ) {}

  async create(data: Partial<CustomerCall>): Promise<CustomerCallDocument> {
    const created = await new this.model(data).save();
    const populated = await this.findById(created._id);
    return populated ?? created;
  }

  async findById(id: Types.ObjectId): Promise<CustomerCallDocument | null> {
    return this.model
      .findById(id)
      .populate('customer')
      .populate('machine')
      .populate('receivedBy', 'name phone')
      .exec();
  }

  async findAll(search?: string): Promise<CustomerCallDocument[]> {
    const filter: Record<string, unknown> = {};
    const normalized = search?.trim();

    if (normalized) {
      const rx = { $regex: normalized, $options: 'i' };
      filter.$or = [
        { customerName: rx },
        { customerPhone: rx },
        { customerAddress: rx },
        { machineName: rx },
        { machineDetails: rx },
        { customerProblemDesc: rx },
        { solution: rx },
        { notes: rx },
        { receivedByName: rx },
      ];
    }

    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('machine')
      .populate('receivedBy', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<CustomerCall>,
  ): Promise<CustomerCallDocument | null> {
    await this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
    return this.findById(id);
  }

  async deleteById(id: Types.ObjectId): Promise<CustomerCallDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
