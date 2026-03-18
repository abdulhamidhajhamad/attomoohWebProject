import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineMaint,
  MachineMaintDocument,
} from '../schemas/machine-maint.schema.js';

@Injectable()
export class MachineMaintRepository {
  constructor(
    @InjectModel(MachineMaint.name)
    private readonly model: Model<MachineMaintDocument>,
  ) {}

  async create(data: Partial<MachineMaint>): Promise<MachineMaintDocument> {
    return new this.model(data).save();
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineMaintDocument | null> {
    return this.model
      .findById(id)
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<MachineMaintDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineMaint>,
  ): Promise<MachineMaintDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineMaintDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
