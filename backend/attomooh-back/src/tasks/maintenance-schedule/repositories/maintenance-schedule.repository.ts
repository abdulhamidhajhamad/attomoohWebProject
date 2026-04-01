import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceSchedule, MaintenanceScheduleDocument } from '../schemas/maintenance-schedule.schema.js';
import { ScheduleStatus } from '../../../common/enums/schedule-status.enum.js';

@Injectable()
export class MaintenanceScheduleRepository {
  constructor(@InjectModel(MaintenanceSchedule.name) private readonly model: Model<MaintenanceScheduleDocument>) {}

  async create(data: Partial<MaintenanceSchedule>): Promise<MaintenanceScheduleDocument> {
    const created = await new this.model(data).save();
    const populated = await this.findById(created._id as Types.ObjectId);
    return populated ?? created;
  }

  async findById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument | null> { return this.model.findById(id).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec(); }

  async findAll(search?: string): Promise<MaintenanceScheduleDocument[]> {
    const filter: Record<string, unknown> = {};
    const q = search?.trim();

    if (q) {
      const rx = { $regex: q, $options: 'i' };
      filter.$or = [
        { machineName: rx },
        { machineDetails: rx },
        { technicianName: rx },
        { rescheduledTechnicianName: rx },
        { rescheduleReason: rx },
        { cancellationReason: rx },
      ];
    }

    return this.model.find(filter).sort({ scheduledDate: -1 }).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec();
  }

  async findByDateRange(from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> { return this.model.find({ scheduledDate: { $gte: from, $lte: to } }).sort({ scheduledDate: 1 }).populate('machineReception').populate('technician', 'name phone').populate('rescheduledTechnician', 'name phone').exec(); }

  async findForTechnicianByDateRange(technicianId: Types.ObjectId, from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> {
    return this.model
      .find({
        $or: [
          {
            status: { $ne: ScheduleStatus.RESCHEDULED },
            technician: technicianId,
            scheduledDate: { $gte: from, $lte: to },
          },
          {
            status: ScheduleStatus.RESCHEDULED,
            rescheduledTechnician: technicianId,
            rescheduledDate: { $gte: from, $lte: to },
          },
        ],
      })
      .sort({ scheduledDate: 1 })
      .populate('machineReception')
      .populate('technician', 'name phone')
      .populate('rescheduledTechnician', 'name phone')
      .exec();
  }

  async updateById(id: Types.ObjectId, data: Partial<MaintenanceSchedule>): Promise<MaintenanceScheduleDocument | null> {
    await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    return this.findById(id);
  }

  async deleteById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}
