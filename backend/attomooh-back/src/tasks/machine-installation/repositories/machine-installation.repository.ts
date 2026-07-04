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

  private readonly receptionPopulate = {
    path: 'machineReception',
    populate: [
      { path: 'receivedBy', select: 'name phone' },
      { path: 'customer', select: 'name phone address' },
      { path: 'machine', select: 'name' },
    ],
  };

  async create(
    data: Partial<MachineInstallation>,
  ): Promise<MachineInstallationDocument> {
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
  ): Promise<MachineInstallationDocument | null> {
    return this.model
      .findById(id)
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async findAll(
    params: { status?: string; search?: string } = {},
  ): Promise<MachineInstallationDocument[]> {
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.search) {
      const rx = new RegExp(params.search, 'i');
      filter.$or = [
        { machineName: rx },
        { machineDetails: rx },
        { technicianName: rx },
        { technicianReport: rx },
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
    data: Partial<MachineInstallation>,
  ): Promise<MachineInstallationDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineInstallationDocument[]> {
    return this.model
      .find({ technician: technicianId })
      .sort({ createdAt: -1 })
      .populate(this.receptionPopulate)
      .populate('technician', 'name phone')
      .exec();
  }

  async findActiveByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineInstallationDocument[]> {
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
