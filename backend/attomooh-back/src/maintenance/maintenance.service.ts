import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MaintenanceRepository } from './repositories/maintenance.repository.js';
import {
  MaintenanceTask,
  MaintenanceTaskDocument,
} from './schemas/maintenance-task.schema.js';
import { EmployeesService } from '../employees/employees.service.js';
import { ServiceOrderRepository } from '../service-orders/repositories/service-order.repository.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { AssignTaskDto } from './dto/assign-task.dto.js';
import { TaskReportDto } from './dto/task-report.dto.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly maintenanceRepo: MaintenanceRepository,
    private readonly employeesService: EmployeesService,
    private readonly serviceOrderRepo: ServiceOrderRepository,
  ) {}

  /* ═══════════════════════════════════
     Task CRUD (Admin)
     ═══════════════════════════════════ */

  /** Create a new maintenance task (Admin only) */
  async createTask(
    dto: CreateTaskDto,
    adminId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument> {
    const data: Record<string, unknown> = {
      description: dto.description ?? '',
      machineInfo: dto.machineInfo ?? '',
      location: dto.location ?? '',
      priority: dto.priority ?? 'medium',
      status: TaskStatus.PENDING,
      createdBy: adminId,
    };

    // Link to service order — auto-derive title & machineInfo
    if (dto.serviceOrder) {
      const orderId = new Types.ObjectId(dto.serviceOrder);
      const order = await this.serviceOrderRepo.findById(orderId);
      if (!order) {
        throw new BadRequestException('Service order not found');
      }
      data.serviceOrder = orderId;

      // Auto-generate title from order info
      const machineName =
        order.machineType && typeof order.machineType === 'object'
          ? (order.machineType as { name?: string }).name ?? ''
          : '';
      const details = order.machineDetails ?? '';
      const machine = machineName || details || 'آلة';
      data.title = `صيانة #${order.formNumber} — ${machine}`;
      data.machineInfo = [machineName, details, order.serialNumber]
        .filter(Boolean)
        .join(' | ');
      data.location = order.customerAddress ?? '';
    } else {
      data.title = dto.title ?? '';
    }

    // Scheduling fields (calendar)
    if (dto.scheduledDate) data.scheduledDate = new Date(dto.scheduledDate);
    if (dto.scheduledStartTime) data.scheduledStartTime = dto.scheduledStartTime;
    if (dto.scheduledEndTime) data.scheduledEndTime = dto.scheduledEndTime;

    // If admin assigns a technician immediately
    if (dto.assignedTo) {
      const tech = await this.employeesService.findById(
        new Types.ObjectId(dto.assignedTo),
      );
      if (tech.role !== UserRole.TECHNICIAN) {
        throw new BadRequestException('User is not a technician');
      }
      data.assignedTo = tech._id;
      data.status = TaskStatus.ASSIGNED;
    }

    return this.maintenanceRepo.create(data);
  }

  /** Update task details (Admin only — only before completion) */
  async updateTask(
    taskId: Types.ObjectId,
    dto: UpdateTaskDto,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot update a completed or cancelled task',
      );
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.machineInfo !== undefined) updateData.machineInfo = dto.machineInfo;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.scheduledDate !== undefined) updateData.scheduledDate = new Date(dto.scheduledDate);
    if (dto.scheduledStartTime !== undefined) updateData.scheduledStartTime = dto.scheduledStartTime;
    if (dto.scheduledEndTime !== undefined) updateData.scheduledEndTime = dto.scheduledEndTime;

    if (dto.assignedTo !== undefined) {
      const tech = await this.employeesService.findById(
        new Types.ObjectId(dto.assignedTo),
      );
      if (tech.role !== UserRole.TECHNICIAN) {
        throw new BadRequestException('User is not a technician');
      }
      updateData.assignedTo = tech._id;
      if (task.status === TaskStatus.PENDING) {
        updateData.status = TaskStatus.ASSIGNED;
      }
    }

    const updated = await this.maintenanceRepo.updateById(taskId, updateData);
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /** Delete a task (Admin only) */
  async deleteTask(taskId: Types.ObjectId): Promise<void> {
    const deleted = await this.maintenanceRepo.deleteById(taskId);
    if (!deleted) throw new NotFoundException('Task not found');
  }

  /** Assign a task to a technician (Admin) */
  async assignTask(
    taskId: Types.ObjectId,
    dto: AssignTaskDto,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot assign a completed or cancelled task',
      );
    }

    const tech = await this.employeesService.findById(
      new Types.ObjectId(dto.technicianId),
    );
    if (tech.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException('User is not a technician');
    }

    const updated = await this.maintenanceRepo.updateById(taskId, {
      assignedTo: tech._id,
      status:
        task.status === TaskStatus.PENDING ? TaskStatus.ASSIGNED : task.status,
    } as Partial<MaintenanceTask>);

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /** Cancel a task (Admin) */
  async cancelTask(taskId: Types.ObjectId): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed task');
    }

    // If technician was working, set them back to available
    if (task.assignedTo && task.status === TaskStatus.IN_PROGRESS) {
      await this.employeesService.updateTechnicianStatus(
        task.assignedTo,
        TechnicianStatus.AVAILABLE,
      );
    }

    const updated = await this.maintenanceRepo.updateById(taskId, {
      status: TaskStatus.CANCELLED,
    } as Partial<MaintenanceTask>);

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /* ═══════════════════════════════════
     Task Lifecycle (Technician)
     ═══════════════════════════════════ */

  /** Technician starts working on a task */
  async startTask(
    taskId: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);
    this.assertOwnership(task, technicianId);

    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException(
        `Cannot start task in "${task.status}" status. Task must be "assigned".`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(task.timeLogs || []),
      { action: 'start' as const, timestamp: now },
    ];

    const updated = await this.maintenanceRepo.updateById(taskId, {
      status: TaskStatus.IN_PROGRESS,
      timeLogs,
    } as Partial<MaintenanceTask>);

    // Update technician status
    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.ON_TASK,
    );

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /** Technician pauses the task */
  async pauseTask(
    taskId: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);
    this.assertOwnership(task, technicianId);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot pause task in "${task.status}" status. Task must be "in_progress".`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(task.timeLogs || []),
      { action: 'pause' as const, timestamp: now },
    ];
    const totalDurationMs = this.calculateDuration(timeLogs);

    const updated = await this.maintenanceRepo.updateById(taskId, {
      status: TaskStatus.PAUSED,
      timeLogs,
      totalDurationMs,
    } as Partial<MaintenanceTask>);

    // Technician is no longer actively working
    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.AVAILABLE,
    );

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /** Technician resumes a paused task */
  async resumeTask(
    taskId: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);
    this.assertOwnership(task, technicianId);

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestException(
        `Cannot resume task in "${task.status}" status. Task must be "paused".`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(task.timeLogs || []),
      { action: 'resume' as const, timestamp: now },
    ];

    const updated = await this.maintenanceRepo.updateById(taskId, {
      status: TaskStatus.IN_PROGRESS,
      timeLogs,
    } as Partial<MaintenanceTask>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.ON_TASK,
    );

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /** Technician finishes the task with a report */
  async finishTask(
    taskId: Types.ObjectId,
    technicianId: Types.ObjectId,
    reportDto: TaskReportDto,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.getTaskOrFail(taskId);
    this.assertOwnership(task, technicianId);

    if (
      task.status !== TaskStatus.IN_PROGRESS &&
      task.status !== TaskStatus.PAUSED
    ) {
      throw new BadRequestException(
        `Cannot finish task in "${task.status}" status. Task must be "in_progress" or "paused".`,
      );
    }

    const now = new Date();
    const timeLogs = [
      ...(task.timeLogs || []),
      { action: 'finish' as const, timestamp: now },
    ];
    const totalDurationMs = this.calculateDuration(timeLogs);

    const updated = await this.maintenanceRepo.updateById(taskId, {
      status: TaskStatus.COMPLETED,
      timeLogs,
      totalDurationMs,
      completedAt: now,
      report: {
        problemDescription: reportDto.problemDescription ?? '',
        solutionDescription: reportDto.solutionDescription ?? '',
        usedParts: reportDto.usedParts ?? [],
        laborCost: reportDto.laborCost ?? 0,
        notes: reportDto.notes ?? '',
      },
    } as Partial<MaintenanceTask>);

    await this.employeesService.updateTechnicianStatus(
      technicianId,
      TechnicianStatus.AVAILABLE,
    );

    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  /* ═══════════════════════════════════
     Queries
     ═══════════════════════════════════ */

  async findAll(): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceRepo.findAll();
  }

  async findById(taskId: Types.ObjectId): Promise<MaintenanceTaskDocument> {
    return this.getTaskOrFail(taskId);
  }

  async findByStatus(status: TaskStatus): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceRepo.findByStatus(status);
  }

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceRepo.findByAssignedTo(technicianId);
  }

  async findActiveTasks(
    technicianId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceRepo.findActiveByAssignedTo(technicianId);
  }

  /** Dashboard stats */
  async getStats(): Promise<{
    byStatus: Record<string, number>;
    total: number;
  }> {
    const byStatus = await this.maintenanceRepo.countByStatus();
    const total = Object.values(byStatus).reduce((s, c) => s + c, 0);
    return { byStatus, total };
  }

  /** Calendar view — tasks within a date range, optionally filtered by technician */
  async findByDateRange(
    from: Date,
    to: Date,
    technicianId?: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument[]> {
    return this.maintenanceRepo.findByDateRange(from, to, technicianId);
  }

  /* ═══════════════════════════════════
     Private Helpers
     ═══════════════════════════════════ */

  private async getTaskOrFail(
    taskId: Types.ObjectId,
  ): Promise<MaintenanceTaskDocument> {
    const task = await this.maintenanceRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  /** Verify the technician is assigned to this task */
  private assertOwnership(
    task: MaintenanceTaskDocument,
    technicianId: Types.ObjectId,
  ): void {
    // assignedTo may be populated (full user object) or a raw ObjectId
    const assignedRaw = task.assignedTo;
    const assignedId =
      assignedRaw && typeof assignedRaw === 'object' && '_id' in assignedRaw
        ? String((assignedRaw as { _id: Types.ObjectId })._id)
        : String(assignedRaw ?? '');

    if (!assignedId || assignedId !== technicianId.toString()) {
      throw new ForbiddenException('You are not assigned to this task');
    }
  }

  /**
   * Calculate total active work duration from time logs.
   * Counts time between start/resume and pause/finish pairs.
   */
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
