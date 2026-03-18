import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceOrder,
  ServiceOrderDocument,
} from '../schemas/service-order.schema.js';
import { ServiceOrderStatus } from '../../common/enums/service-order-status.enum.js';

/** Standard populate paths used in most queries */
const POPULATE = [
  { path: 'machineType', select: 'name description' },
  { path: 'customer', select: 'name phone address hasAnnualContract' },
  { path: 'assignedTo', select: 'name email phone technicianStatus' },
  { path: 'createdBy', select: 'name email' },
];

@Injectable()
export class ServiceOrderRepository {
  constructor(
    @InjectModel(ServiceOrder.name)
    private readonly orderModel: Model<ServiceOrderDocument>,
  ) {}

  async create(data: Partial<ServiceOrder>): Promise<ServiceOrderDocument> {
    const doc = await new this.orderModel(data).save();
    return doc.populate(POPULATE);
  }

  async findById(id: Types.ObjectId): Promise<ServiceOrderDocument | null> {
    return this.orderModel.findById(id).populate(POPULATE).exec();
  }

  async findAll(
    filter: Record<string, unknown> = {},
  ): Promise<ServiceOrderDocument[]> {
    return this.orderModel
      .find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(
    status: ServiceOrderStatus,
  ): Promise<ServiceOrderDocument[]> {
    return this.findAll({ status });
  }

  async findByAssignedTo(
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.findAll({ assignedTo: technicianId });
  }

  async findActiveByAssignedTo(
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.findAll({
      assignedTo: technicianId,
      status: {
        $in: [ServiceOrderStatus.WAITING, ServiceOrderStatus.IN_MAINTENANCE, ServiceOrderStatus.POSTPONED],
      },
    });
  }

  async findByCustomer(
    customerId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.findAll({ customer: customerId });
  }

  async findByMachineType(
    machineTypeId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.findAll({ machineType: machineTypeId });
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<ServiceOrder>,
  ): Promise<ServiceOrderDocument | null> {
    return this.orderModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate(POPULATE)
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<ServiceOrderDocument | null> {
    return this.orderModel.findByIdAndDelete(id).exec();
  }

  /** Count by status for dashboard stats */
  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of results as { _id: string; count: number }[]) {
      counts[r._id] = r.count;
    }
    return counts;
  }

  /** Count orders by machine type (for reports) */
  async countByMachineType(): Promise<
    { machineTypeId: string; machineTypeName: string; count: number }[]
  > {
    return this.orderModel.aggregate([
      { $match: { machineType: { $ne: null } } },
      { $group: { _id: '$machineType', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'machinetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'mt',
        },
      },
      { $unwind: { path: '$mt', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          machineTypeId: '$_id',
          machineTypeName: { $ifNull: ['$mt.name', 'غير محدد'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /** Count orders by technician (for reports) */
  async countByTechnician(): Promise<
    { technicianId: string; technicianName: string; count: number; completed: number }[]
  > {
    return this.orderModel.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [ServiceOrderStatus.READY, ServiceOrderStatus.DELIVERED],
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
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          technicianId: '$_id',
          technicianName: { $ifNull: ['$user.name', 'غير معيّن'] },
          count: 1,
          completed: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /** Count orders by customer (for reports) */
  async countByCustomer(): Promise<
    { customerId: string; customerName: string; count: number }[]
  > {
    return this.orderModel.aggregate([
      { $match: { customer: { $ne: null } } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'cust',
        },
      },
      { $unwind: { path: '$cust', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          customerName: { $ifNull: ['$cust.name', 'غير محدد'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}
