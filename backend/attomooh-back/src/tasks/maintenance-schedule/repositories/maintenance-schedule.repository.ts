import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceSchedule, MaintenanceScheduleDocument } from '../schemas/maintenance-schedule.schema.js';

@Injectable()
export class MaintenanceScheduleRepository {
  constructor(@InjectModel(MaintenanceSchedule.name) private readonly model: Model<MaintenanceScheduleDocument>) {}
  async create(data: Partial<MaintenanceSchedule>): Promise<MaintenanceScheduleDocument> { return new this.model(data).save(); }
  async findById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument | null> { return this.model.findById(id).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec(); }
  async findAll(): Promise<MaintenanceScheduleDocument[]> { return this.model.find().sort({ scheduledDate: -1 }).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec(); }
  async findByDateRange(from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> { return this.model.find({ scheduledDate: { $gte: from, $lte: to } }).sort({ scheduledDate: 1 }).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec(); }
  async updateById(id: Types.ObjectId, data: Partial<MaintenanceSchedule>): Promise<MaintenanceScheduleDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }
  async deleteById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}
