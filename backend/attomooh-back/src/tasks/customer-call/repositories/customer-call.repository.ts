import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomerCall, CustomerCallDocument } from '../schemas/customer-call.schema.js';

@Injectable()
export class CustomerCallRepository {
  constructor(@InjectModel(CustomerCall.name) private readonly model: Model<CustomerCallDocument>) {}
  async create(data: Partial<CustomerCall>): Promise<CustomerCallDocument> { return new this.model(data).save(); }
  async findById(id: Types.ObjectId): Promise<CustomerCallDocument | null> { return this.model.findById(id).populate('customer').populate('machine').populate('receivedBy', 'name phone').exec(); }
  async findAll(): Promise<CustomerCallDocument[]> { return this.model.find().sort({ createdAt: -1 }).populate('customer').populate('machine').populate('receivedBy', 'name phone').exec(); }
  async updateById(id: Types.ObjectId, data: Partial<CustomerCall>): Promise<CustomerCallDocument | null> { return this.model.findByIdAndUpdate(id, data, { new: true }).exec(); }
  async deleteById(id: Types.ObjectId): Promise<CustomerCallDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}
