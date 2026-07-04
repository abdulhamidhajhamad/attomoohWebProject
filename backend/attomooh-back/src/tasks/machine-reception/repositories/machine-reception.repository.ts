import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineReception,
  MachineReceptionDocument,
} from '../schemas/machine-reception.schema.js';

@Injectable()
export class MachineReceptionRepository {
  constructor(
    @InjectModel(MachineReception.name)
    private readonly model: Model<MachineReceptionDocument>,
  ) {}

  async create(
    data: Partial<MachineReception>,
  ): Promise<MachineReceptionDocument> {
    return new this.model(data).save();
  }

  async findById(id: Types.ObjectId): Promise<MachineReceptionDocument | null> {
    return this.model
      .findById(id)
      .populate('machine')
      .populate('customer')
      .populate('receivedBy', 'name phone')
      .populate('assignedTo', 'name phone')
      .exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<MachineReceptionDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('machine')
      .populate('customer')
      .populate('receivedBy', 'name phone')
      .populate('assignedTo', 'name phone')
      .exec();
  }

  async findByStatus(status: string): Promise<MachineReceptionDocument[]> {
    return this.findAll({ status });
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineReception>,
  ): Promise<MachineReceptionDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('machine')
      .populate('customer')
      .populate('receivedBy', 'name phone')
      .populate('assignedTo', 'name phone')
      .exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineReceptionDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
