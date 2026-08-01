import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineProduction,
  MachineProductionDocument,
} from '../schemas/machine-production.schema.js';
import { escapeRegex } from '../../../common/utils/regex.js';

@Injectable()
export class MachineProductionRepository {
  constructor(
    @InjectModel(MachineProduction.name)
    private readonly model: Model<MachineProductionDocument>,
  ) {}

  private readonly receptionPopulate = {
    path: 'machineReception',
    populate: [
      { path: 'receivedBy', select: 'name phone' },
      { path: 'customer', select: 'name phone address' },
      { path: 'machine', select: 'name' },
    ],
  };

  async create(
    data: Partial<MachineProduction>,
  ): Promise<MachineProductionDocument> {
    const doc = await new this.model(data).save();
    return this.model
      .findById(doc._id)
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .orFail()
      .exec();
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument | null> {
    return this.model
      .findById(id)
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async findAll(
    params: { search?: string } = {},
  ): Promise<MachineProductionDocument[]> {
    const filter: Record<string, unknown> = {};
    if (params.search) {
      const rx = new RegExp(escapeRegex(params.search), 'i');
      filter.$or = [
        { customId: rx },
        { machineName: rx },
        { machineDetails: rx },
        { machineNameAndDetails: rx },
        { technicianName: rx },
        { pauseReason: rx },
      ];
    }
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineProduction>,
  ): Promise<MachineProductionDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineProductionDocument[]> {
    return this.model
      .find({ technician: technicianId })
      .sort({ createdAt: -1 })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async findActiveByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineProductionDocument[]> {
    return this.model
      .find({
        technician: technicianId,
        status: { $nin: ['ready', 'rejected'] },
      })
      .sort({ createdAt: -1 })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }
}
