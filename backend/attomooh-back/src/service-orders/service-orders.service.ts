import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ServiceOrderRepository } from './repositories/service-order.repository.js';
import { CounterRepository } from './repositories/counter.repository.js';
import {
  ServiceOrder,
  ServiceOrderDocument,
} from './schemas/service-order.schema.js';
import { UserService } from '../user/user.service.js';
import { CreateServiceOrderDto } from './dto/create-service-order.dto.js';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto.js';
import { CompleteServiceOrderDto } from './dto/complete-service-order.dto.js';
import { AssignServiceOrderDto } from './dto/assign-service-order.dto.js';
import { ServiceOrderStatus } from '../common/enums/service-order-status.enum.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly orderRepo: ServiceOrderRepository,
    private readonly counterRepo: CounterRepository,
    private readonly userService: UserService,
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
      Object.values(ServiceOrderStatus).includes(
        status as ServiceOrderStatus,
      )
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
    if (dto.customerPhone !== undefined)
      data.customerPhone = dto.customerPhone;
    if (dto.customerAddress !== undefined)
      data.customerAddress = dto.customerAddress;
    if (dto.customerNotes !== undefined)
      data.customerNotes = dto.customerNotes;
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
      throw new BadRequestException('Cannot assign to a completed/delivered order');
    }

    const tech = await this.userService.findById(
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

    await this.userService.updateTechnicianStatus(
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

    await this.userService.updateTechnicianStatus(
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

    await this.userService.updateTechnicianStatus(
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

    await this.userService.updateTechnicianStatus(
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
    return this.orderRepo.countByMachineType();
  }

  async reportByTechnician() {
    return this.orderRepo.countByTechnician();
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
}
