import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema.js';
import { escapeRegex } from '../../common/utils/regex.js';

@Injectable()
export class SupplierRepository {
  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async create(data: Partial<Supplier>): Promise<SupplierDocument> {
    const doc = await new this.supplierModel(data).save();
    return this.findById(doc._id) as Promise<SupplierDocument>;
  }

  async findById(id: Types.ObjectId): Promise<SupplierDocument | null> {
    return this.supplierModel.findById(id).populate('area').exec();
  }

  async findAll(): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find()
      .sort({ createdAt: -1 })
      .populate('area')
      .exec();
  }

  async search(query: string): Promise<SupplierDocument[]> {
    const regex = new RegExp(escapeRegex(query), 'i');
    return this.supplierModel
      .find({ $or: [{ name: regex }, { phone: regex }] })
      .populate('area')
      .sort({ name: 1 })
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<Supplier>,
  ): Promise<SupplierDocument | null> {
    return this.supplierModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('area')
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<SupplierDocument | null> {
    return this.supplierModel.findByIdAndDelete(id).exec();
  }
}
