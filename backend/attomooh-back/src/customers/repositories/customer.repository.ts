import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customer.schema.js';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async create(data: Partial<Customer>): Promise<CustomerDocument> {
    const doc = await new this.customerModel(data).save();
    return this.findById(doc._id) as Promise<CustomerDocument>;
  }

  async findById(id: Types.ObjectId): Promise<CustomerDocument | null> {
    return this.customerModel
      .findById(id)
      .populate('area')
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async findAll(): Promise<CustomerDocument[]> {
    return this.customerModel
      .find()
      .sort({ createdAt: -1 })
      .populate('area')
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async search(query: string): Promise<CustomerDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.customerModel
      .find({ $or: [{ name: regex }, { phone: regex }, { customId: regex }] })
      .populate('area')
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .sort({ name: 1 })
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<Customer>,
  ): Promise<CustomerDocument | null> {
    return this.customerModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('area')
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<CustomerDocument | null> {
    return this.customerModel.findByIdAndDelete(id).exec();
  }
}
