import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineProduction,
  MachineProductionDocument,
} from '../schemas/machine-production.schema.js';

@Injectable()
export class MachineProductionRepository {
  constructor(
    @InjectModel(MachineProduction.name)
    private readonly model: Model<MachineProductionDocument>,
  ) {}

  async create(
    data: Partial<MachineProduction>,
  ): Promise<MachineProductionDocument> {
    return new this.model(data).save();
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument | null> {
    return this.model
      .findById(id)
      .populate('technician', 'name phone')
      .exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<MachineProductionDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('technician', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineProduction>,
  ): Promise<MachineProductionDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
