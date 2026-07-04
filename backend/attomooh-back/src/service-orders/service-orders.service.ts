import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ServiceOrderRepository } from './repositories/service-order.repository.js';
import { CounterRepository } from './repositories/counter.repository.js';
import {
  ServiceOrder,
  ServiceOrderDocument,
} from './schemas/service-order.schema.js';
import { EmployeesService } from '../employees/employees.service.js';
import { CreateServiceOrderDto } from './dto/create-service-order.dto.js';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto.js';
import { CompleteServiceOrderDto } from './dto/complete-service-order.dto.js';
import { AssignServiceOrderDto } from './dto/assign-service-order.dto.js';
import { ServiceOrderStatus } from '../common/enums/service-order-status.enum.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';
import { TechnicianTasksService } from '../technician-tasks/technician-tasks.service.js';

type TaskCollectionNames = {
  maintenance: string;
  inspection: string;
  installation: string;
  production: string;
  receptions: string;
  machines: string;
};

type TaskTechnicianStats = {
  technicianId: string;
  count: number;
  completed: number;
  technicianTotalCost: number;
  companyTotalCost: number;
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly orderRepo: ServiceOrderRepository,
    private readonly counterRepo: CounterRepository,
    private readonly employeesService: EmployeesService,
    private readonly technicianTasksService: TechnicianTasksService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /* ═══════════════════════════════════
     Reception — استلام الآلة
     ═══════════════════════════════════ */

  async createOrder(
    dto: CreateServiceOrderDto,
    adminId: Types.ObjectId,
  ): Promise<ServiceOrderDocument> {
    const formNumber = await this.counterRepo.getNextValue('serviceOrder');

    const data: Partial<ServiceOrder> = {
      formNumber,
      machineDetails: dto.machineDetails ?? '',
      serialNumber: dto.serialNumber ?? '',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone ?? '',
      customerAddress: dto.customerAddress ?? '',
      customerNotes: dto.customerNotes ?? '',
      warranty: dto.warranty ?? false,
      condition: dto.condition,
      customerProblemDesc: dto.customerProblemDesc ?? '',
      status: ServiceOrderStatus.WAITING,
      createdBy: adminId,
    };

    if (dto.machineType) {
      data.machineType = new Types.ObjectId(dto.machineType);
    }
    if (dto.customer) {
      data.customer = new Types.ObjectId(dto.customer);
    }
    if (dto.expectedDeliveryDate) {
      data.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
    }

    return this.orderRepo.create(data);
  }

  /* ═══════════════════════════════════
     Admin CRUD
     ═══════════════════════════════════ */

  async findAll(status?: string): Promise<ServiceOrderDocument[]> {
    if (
      status &&
      Object.values(ServiceOrderStatus).includes(status as ServiceOrderStatus)
    ) {
      return this.orderRepo.findByStatus(status as ServiceOrderStatus);
    }
    return this.orderRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<ServiceOrderDocument> {
    return this.getOrderOrFail(id);
  }

  async updateOrder(
    id: Types.ObjectId,
    dto: UpdateServiceOrderDto,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);

    if (order.status === ServiceOrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot update a delivered order');
    }

    const data: Record<string, unknown> = {};
    if (dto.machineType !== undefined)
      data.machineType = new Types.ObjectId(dto.machineType);
    if (dto.machineDetails !== undefined)
      data.machineDetails = dto.machineDetails;
    if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber;
    if (dto.customer !== undefined)
      data.customer = new Types.ObjectId(dto.customer);
    if (dto.customerName !== undefined) data.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) data.customerPhone = dto.customerPhone;
    if (dto.customerAddress !== undefined)
      data.customerAddress = dto.customerAddress;
    if (dto.customerNotes !== undefined) data.customerNotes = dto.customerNotes;
    if (dto.warranty !== undefined) data.warranty = dto.warranty;
    if (dto.expectedDeliveryDate !== undefined)
      data.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.customerProblemDesc !== undefined)
      data.customerProblemDesc = dto.customerProblemDesc;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.orderRepo.updateById(id, data);
    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  async deleteOrder(id: Types.ObjectId): Promise<void> {
    const deleted = await this.orderRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Service order not found');
  }

  /* ═══════════════════════════════════
     Assignment — تعيين فني
     ═══════════════════════════════════ */

  async assignTechnician(
    id: Types.ObjectId,
    dto: AssignServiceOrderDto,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);

    if (
      order.status === ServiceOrderStatus.READY ||
      order.status === ServiceOrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Cannot assign to a completed/delivered order',
      );
    }

    const tech = await this.employeesService.findById(
      new Types.ObjectId(dto.technicianId),
    );
    if (tech.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException('User is not a technician');
    }

    const updated = await this.orderRepo.updateById(id, {
      assignedTo: tech._id,
    } as Partial<ServiceOrder>);
    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /* ═══════════════════════════════════
     Technician Lifecycle
     ═══════════════════════════════════ */

  /** بدء العمل على الآلة */
  async startWork(
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);
    this.assertOwnership(order, technicianId);

    if (
      order.status !== ServiceOrderStatus.WAITING &&
      order.status !== ServiceOrderStatus.POSTPONED
    ) {
      throw new BadRequestException(
        `Cannot start order in "${order.status}" status`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(order.timeLogs || []),
      { action: 'start' as const, timestamp: now },
    ];

    const updated = await this.orderRepo.updateById(id, {
      status: ServiceOrderStatus.IN_MAINTENANCE,
      timeLogs,
    } as Partial<ServiceOrder>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.ON_TASK,
    );

    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /** إيقاف مؤقت */
  async pauseWork(
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);
    this.assertOwnership(order, technicianId);

    if (order.status !== ServiceOrderStatus.IN_MAINTENANCE) {
      throw new BadRequestException(
        `Cannot pause order in "${order.status}" status`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(order.timeLogs || []),
      { action: 'pause' as const, timestamp: now },
    ];
    const totalDurationMs = this.calculateDuration(timeLogs);

    const updated = await this.orderRepo.updateById(id, {
      status: ServiceOrderStatus.POSTPONED,
      timeLogs,
      totalDurationMs,
    } as Partial<ServiceOrder>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.AVAILABLE,
    );

    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /** استئناف */
  async resumeWork(
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);
    this.assertOwnership(order, technicianId);

    if (order.status !== ServiceOrderStatus.POSTPONED) {
      throw new BadRequestException(
        `Cannot resume order in "${order.status}" status`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(order.timeLogs || []),
      { action: 'resume' as const, timestamp: now },
    ];

    const updated = await this.orderRepo.updateById(id, {
      status: ServiceOrderStatus.IN_MAINTENANCE,
      timeLogs,
    } as Partial<ServiceOrder>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.ON_TASK,
    );

    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /** إنهاء الصيانة + تقرير */
  async completeOrder(
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
    dto: CompleteServiceOrderDto,
  ): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);
    this.assertOwnership(order, technicianId);

    if (
      order.status !== ServiceOrderStatus.IN_MAINTENANCE &&
      order.status !== ServiceOrderStatus.POSTPONED
    ) {
      throw new BadRequestException(
        `Cannot complete order in "${order.status}" status`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(order.timeLogs || []),
      { action: 'finish' as const, timestamp: now },
    ];
    const totalDurationMs = this.calculateDuration(timeLogs);

    const spareParts = dto.spareParts ?? [];
    const partsCost = spareParts.reduce(
      (sum, p) => sum + p.quantity * (p.cost ?? 0),
      0,
    );
    const maintenanceFee = dto.maintenanceFee ?? 0;
    const totalCost = partsCost + maintenanceFee;

    const updated = await this.orderRepo.updateById(id, {
      status: ServiceOrderStatus.READY,
      timeLogs,
      totalDurationMs,
      completionReport: {
        completedAt: now,
        technicianReport: dto.technicianReport ?? '',
        durationMs: totalDurationMs,
        spareParts,
        maintenanceFee,
        totalCost,
        notes: dto.notes ?? '',
      },
    } as Partial<ServiceOrder>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.AVAILABLE,
    );

    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /* ═══════════════════════════════════
     Delivery — تسليم الآلة
     ═══════════════════════════════════ */

  async deliverOrder(id: Types.ObjectId): Promise<ServiceOrderDocument> {
    const order = await this.getOrderOrFail(id);

    if (order.status !== ServiceOrderStatus.READY) {
      throw new BadRequestException(
        `Cannot deliver order in "${order.status}" status. Must be "ready".`,
      );
    }

    const updated = await this.orderRepo.updateById(id, {
      status: ServiceOrderStatus.DELIVERED,
      deliveryDate: new Date(),
    } as Partial<ServiceOrder>);

    if (!updated) throw new NotFoundException('Service order not found');
    return updated;
  }

  /* ═══════════════════════════════════
     Queries
     ═══════════════════════════════════ */

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.orderRepo.findByAssignedTo(technicianId);
  }

  async findByCustomer(
    customerId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.orderRepo.findByCustomer(customerId);
  }

  async findActiveByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<ServiceOrderDocument[]> {
    return this.orderRepo.findActiveByAssignedTo(technicianId);
  }

  /* ═══════════════════════════════════
     Reports
     ═══════════════════════════════════ */

  async getStats() {
    const byStatus = await this.orderRepo.countByStatus();
    const total = Object.values(byStatus).reduce((s, c) => s + c, 0);
    return { byStatus, total };
  }

  async reportByMachineType() {
    return this.aggregateTaskCostsByMachineType();
  }

  async reportByTechnician() {
    const [taskStats, technicians] = await Promise.all([
      this.aggregateTaskStatsByTechnician(),
      this.employeesService.findTechnicians(),
    ]);

    const statsByTechnicianId = new Map(
      taskStats.map((row) => [row.technicianId, row]),
    );

    return technicians
      .map((tech) => {
        const technicianId = tech._id.toString();
        const stats = statsByTechnicianId.get(technicianId);

        return {
          technicianId,
          technicianName: tech.name,
          count: stats?.count ?? 0,
          completed: stats?.completed ?? 0,
          technicianTotalCost: stats?.technicianTotalCost ?? 0,
          companyTotalCost: stats?.companyTotalCost ?? 0,
          customId: tech.customId,
          phone: tech.phone,
          email: tech.email,
          technicianStatus: tech.technicianStatus,
          isActive: tech.isActive,
        };
      })
      .sort(
        (a, b) =>
          b.count - a.count ||
          b.technicianTotalCost - a.technicianTotalCost ||
          a.technicianName.localeCompare(b.technicianName, 'ar'),
      );
  }

  async getTechnicianTasks(technicianId: Types.ObjectId) {
    return this.technicianTasksService.getAllTasksForTechnician(technicianId);
  }

  async reportByCustomer() {
    return this.orderRepo.countByCustomer();
  }

  /* ═══════════════════════════════════
     Private Helpers
     ═══════════════════════════════════ */

  private async getOrderOrFail(
    id: Types.ObjectId,
  ): Promise<ServiceOrderDocument> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException('Service order not found');
    return order;
  }

  private assertOwnership(
    order: ServiceOrderDocument,
    technicianId: Types.ObjectId,
  ): void {
    const assignedRaw = order.assignedTo;
    const assignedId =
      assignedRaw && typeof assignedRaw === 'object' && '_id' in assignedRaw
        ? String((assignedRaw as { _id: Types.ObjectId })._id)
        : String(assignedRaw ?? '');

    if (!assignedId || assignedId !== technicianId.toString()) {
      throw new ForbiddenException('You are not assigned to this order');
    }
  }

  private calculateDuration(
    timeLogs: { action: string; timestamp: Date }[],
  ): number {
    let totalMs = 0;
    let lastStart: Date | null = null;

    for (const log of timeLogs) {
      if (log.action === 'start' || log.action === 'resume') {
        lastStart = new Date(log.timestamp);
      } else if (
        (log.action === 'pause' || log.action === 'finish') &&
        lastStart
      ) {
        totalMs += new Date(log.timestamp).getTime() - lastStart.getTime();
        lastStart = null;
      }
    }
    return totalMs;
  }

  private getTaskCollectionNames(): TaskCollectionNames {
    const getCollection = (modelName: string, fallback: string) => {
      try {
        return this.connection.model(modelName).collection.name;
      } catch {
        return fallback;
      }
    };

    return {
      maintenance: getCollection('MachineMaint', 'machinemaints'),
      inspection: getCollection('MachineInspection', 'machineinspections'),
      installation: getCollection(
        'MachineInstallation',
        'machineinstallations',
      ),
      production: getCollection('MachineProduction', 'machineproductions'),
      receptions: getCollection('MachineReception', 'machinereceptions'),
      machines: getCollection('Machine', 'machines'),
    };
  }

  private taskProjectionPipeline(): Record<string, unknown>[] {
    return [
      {
        $project: {
          _id: 1,
          machineReception: 1,
          machineName: { $ifNull: ['$machineName', ''] },
          machineDetails: { $ifNull: ['$machineDetails', ''] },
          technician: 1,
          status: { $ifNull: ['$status', ''] },
          technicianFee: { $ifNull: ['$technicianFee', 0] },
          companyFee: { $ifNull: ['$companyFee', 0] },
        },
      },
    ];
  }

  private async aggregateTaskCostsByMachineType(): Promise<
    {
      machineTypeId: string;
      machineTypeName: string;
      count: number;
      technicianTotalCost: number;
      companyTotalCost: number;
    }[]
  > {
    const collections = this.getTaskCollectionNames();

    const machineTypeNameExpr = {
      $let: {
        vars: {
          machineRefName: {
            $trim: { input: { $ifNull: ['$machine.name', ''] } },
          },
          taskMachineName: {
            $trim: { input: { $ifNull: ['$machineName', ''] } },
          },
          receptionMachineDetails: {
            $trim: {
              input: { $ifNull: ['$reception.machineDetails', ''] },
            },
          },
          taskMachineDetails: {
            $trim: { input: { $ifNull: ['$machineDetails', ''] } },
          },
        },
        in: {
          $switch: {
            branches: [
              {
                case: { $gt: [{ $strLenCP: '$$machineRefName' }, 0] },
                then: '$$machineRefName',
              },
              {
                case: { $gt: [{ $strLenCP: '$$taskMachineName' }, 0] },
                then: '$$taskMachineName',
              },
              {
                case: {
                  $gt: [{ $strLenCP: '$$receptionMachineDetails' }, 0],
                },
                then: '$$receptionMachineDetails',
              },
              {
                case: { $gt: [{ $strLenCP: '$$taskMachineDetails' }, 0] },
                then: '$$taskMachineDetails',
              },
            ],
            default: 'غير محدد',
          },
        },
      },
    };

    const pipeline: Record<string, unknown>[] = [
      ...this.taskProjectionPipeline(),
      {
        $unionWith: {
          coll: collections.inspection,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      {
        $unionWith: {
          coll: collections.installation,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      {
        $unionWith: {
          coll: collections.production,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      {
        $lookup: {
          from: collections.receptions,
          localField: 'machineReception',
          foreignField: '_id',
          as: 'reception',
        },
      },
      { $unwind: { path: '$reception', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: collections.machines,
          localField: 'reception.machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
      { $unwind: { path: '$machine', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          machineTypeName: machineTypeNameExpr,
          machineKey: {
            $ifNull: [
              { $toString: '$machineReception' },
              { $concat: ['task:', { $toString: '$_id' }] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            machineTypeName: '$machineTypeName',
            machineKey: '$machineKey',
          },
          technicianTotalCost: { $sum: '$technicianFee' },
          companyTotalCost: { $sum: '$companyFee' },
        },
      },
      {
        $group: {
          _id: '$_id.machineTypeName',
          count: { $sum: 1 },
          technicianTotalCost: { $sum: '$technicianTotalCost' },
          companyTotalCost: { $sum: '$companyTotalCost' },
        },
      },
      {
        $project: {
          _id: 0,
          machineTypeId: '$_id',
          machineTypeName: '$_id',
          count: 1,
          technicianTotalCost: { $round: ['$technicianTotalCost', 2] },
          companyTotalCost: { $round: ['$companyTotalCost', 2] },
        },
      },
      { $sort: { count: -1, machineTypeName: 1 } },
    ];

    return this.connection
      .collection(collections.maintenance)
      .aggregate(pipeline)
      .toArray() as Promise<
      {
        machineTypeId: string;
        machineTypeName: string;
        count: number;
        technicianTotalCost: number;
        companyTotalCost: number;
      }[]
    >;
  }

  private async aggregateTaskStatsByTechnician(): Promise<
    TaskTechnicianStats[]
  > {
    const collections = this.getTaskCollectionNames();
    const completedStatuses = ['ready', 'delivered', 'completed', 'done'];

    const pipeline: Record<string, unknown>[] = [
      ...this.taskProjectionPipeline(),
      {
        $unionWith: {
          coll: collections.inspection,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      {
        $unionWith: {
          coll: collections.installation,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      {
        $unionWith: {
          coll: collections.production,
          pipeline: this.taskProjectionPipeline(),
        },
      },
      { $match: { technician: { $ne: null } } },
      {
        $group: {
          _id: '$technician',
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', completedStatuses] }, 1, 0],
            },
          },
          technicianTotalCost: { $sum: '$technicianFee' },
          companyTotalCost: { $sum: '$companyFee' },
        },
      },
      {
        $project: {
          _id: 0,
          technicianId: { $toString: '$_id' },
          count: 1,
          completed: 1,
          technicianTotalCost: { $round: ['$technicianTotalCost', 2] },
          companyTotalCost: { $round: ['$companyTotalCost', 2] },
        },
      },
    ];

    return this.connection
      .collection(collections.maintenance)
      .aggregate(pipeline)
      .toArray() as Promise<TaskTechnicianStats[]>;
  }
}
