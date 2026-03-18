import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MachineInspection, MachineInspectionDocument } from '../schemas/machine-inspection.schema.js';

@Injectable()
export class MachineInspectionRepository {
  constructor(@InjectModel(MachineInspection.name) private readonly model: Model<MachineInspectionDocument>) {}

  async create(data: Partial<MachineInspection>): Promise<MachineInspectionDocument> { return new this.model(data).save(); }
  async findById(id: Types.ObjectId): Promise<MachineInspectionDocument | null> { return this.model.findById(id).populate('machineReception').populate('technician', 'name phone').exec(); }
  async findAll(filter: Record<string, unknown> = {}): Promise<MachineInspectionDocument[]> { return this.model.find(filter).sort({ createdAt: -1 }).populate('machineReception').populate('technician', 'name phone').exec(); }
  async updateById(id: Types.ObjectId, data: Partial<MachineInspection>): Promise<MachineInspectionDocument | null> { return this.model.findByIdAndUpdate(id, data, { new: true }).exec(); }
  async deleteById(id: Types.ObjectId): Promise<MachineInspectionDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}
