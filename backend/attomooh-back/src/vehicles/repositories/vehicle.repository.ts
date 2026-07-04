import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema.js';

@Injectable()
export class VehicleRepository {
  constructor(
    @InjectModel(Vehicle.name) private readonly model: Model<VehicleDocument>,
  ) {}

  async create(data: Partial<Vehicle>): Promise<VehicleDocument> {
    const doc = await new this.model(data).save();
    return this.findById(doc._id) as Promise<VehicleDocument>;
  }
  async findById(id: Types.ObjectId): Promise<VehicleDocument | null> {
    return this.model
      .findById(id)
      .populate('responsibleUser', 'name phone')
      .exec();
  }
  async findAll(): Promise<VehicleDocument[]> {
    return this.model
      .find()
      .sort({ createdAt: -1 })
      .populate('responsibleUser', 'name phone')
      .exec();
  }
  async search(query: string): Promise<VehicleDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.model
      .find({ $or: [{ brandAndModel: regex }, { plateNumber: regex }] })
      .populate('responsibleUser', 'name phone')
      .sort({ brandAndModel: 1 })
      .exec();
  }
  async updateById(
    id: Types.ObjectId,
    data: Partial<Vehicle>,
  ): Promise<VehicleDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('responsibleUser', 'name phone')
      .exec();
  }
  async deleteById(id: Types.ObjectId): Promise<VehicleDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
