import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineInstallation,
  MachineInstallationDocument,
} from '../schemas/machine-installation.schema.js';

@Injectable()
export class MachineInstallationRepository {
  constructor(
    @InjectModel(MachineInstallation.name)
    private readonly model: Model<MachineInstallationDocument>,
  ) {}

  async create(
    data: Partial<MachineInstallation>,
  ): Promise<MachineInstallationDocument> {
    return new this.model(data).save();
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument | null> {
    return this.model
      .findById(id)
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<MachineInstallationDocument[]> {
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineInstallation>,
  ): Promise<MachineInstallationDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
