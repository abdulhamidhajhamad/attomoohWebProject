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
    const doc = await new this.model(data).save();
    return this.model
      .findById(doc._id)
      .populate('machineReception')
      .populate('technician', 'name phone')
      .orFail()
      .exec();
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

  async findAll(params: { status?: string; search?: string } = {}): Promise<MachineMaintDocument[]> {
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
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineMaint>,
  ): Promise<MachineMaintDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MachineMaintDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findByTechnician(technicianId: Types.ObjectId): Promise<MachineMaintDocument[]> {
    return this.model
      .find({ technician: technicianId })
      .sort({ createdAt: -1 })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }

  async findActiveByTechnician(technicianId: Types.ObjectId): Promise<MachineMaintDocument[]> {
    return this.model
      .find({
        technician: technicianId,
        status: { $nin: ['ready', 'rejected'] },
      })
      .sort({ createdAt: -1 })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .exec();
  }
}
