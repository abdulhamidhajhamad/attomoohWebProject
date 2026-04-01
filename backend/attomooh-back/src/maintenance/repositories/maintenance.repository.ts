import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MaintenanceTask,
  MaintenanceTaskDocument,
} from '../schemas/maintenance-task.schema.js';
import { TaskStatus } from '../../common/enums/task-status.enum.js';

@Injectable()
export class MaintenanceRepository {
  constructor(
    @InjectModel(MaintenanceTask.name)
    private readonly taskModel: Model<MaintenanceTaskDocument>,
  ) {}

  async create(
    data: Partial<MaintenanceTask>,
  ): Promise<MaintenanceTaskDocument> {
    const task = new this.taskModel(data);
    return task.save();
  }

  async findById(id: Types.ObjectId): Promise<MaintenanceTaskDocument | null> {
    return this.taskModel
      .findById(id)
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .exec();
  }

  async findAll(): Promise<MaintenanceTaskDocument[]> {
    return this.taskModel
      .find()
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: TaskStatus): Promise<MaintenanceTaskDocument[]> {
    return this.taskModel
      .find({ status })
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByAssignedTo(
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    return this.taskModel
      .find({ assignedTo: technicianId })
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByAssignedTo(
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    return this.taskModel
      .find({
        assignedTo: technicianId,
        status: {
          $in: [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.PAUSED],
        },
      })
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MaintenanceTask>,
  ): Promise<MaintenanceTaskDocument | null> {
    return this.taskModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .exec();
  }

  async deleteById(
    id: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument | null> {
    return this.taskModel.findByIdAndDelete(id).exec();
  }

  /** Count tasks grouped by status */
  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.taskModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of results as { _id: string; count: number }[]) {
      counts[r._id] = r.count;
    }
    return counts;
  }

  /** Count tasks grouped by technician */
  async countByTechnician(): Promise<
    { technicianId: string; count: number }[]
  > {
    return this.taskModel.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      TaskStatus.ASSIGNED,
                      TaskStatus.IN_PROGRESS,
                      TaskStatus.PAUSED,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          technicianId: '$_id',
          count: 1,
          active: 1,
        },
      },
    ]);
  }

  /** Find tasks within a date range (for calendar view) */
  async findByDateRange(
    from: Date,
    to: Date,
    technicianId?: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    const filter: Record<string, unknown> = {
      scheduledDate: { $gte: from, $lte: to },
    };
    if (technicianId) filter.assignedTo = technicianId;

    return this.taskModel
      .find(filter)
      .populate('assignedTo', 'name email phone technicianStatus')
      .populate('createdBy', 'name email')
      .populate({ path: 'serviceOrder', populate: { path: 'machineType', select: 'name' } })
      .sort({ scheduledDate: 1, scheduledStartTime: 1 })
      .exec();
  }
}
