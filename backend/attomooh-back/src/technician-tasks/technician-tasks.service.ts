import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineInspectionService } from '../tasks/machine-inspection/machine-inspection.service.js';
import { MachineMaintService } from '../tasks/machine-maintenance/machine-maint.service.js';
import { MachineInstallationService } from '../tasks/machine-installation/machine-installation.service.js';
import { MachineProductionService } from '../tasks/machine-production/machine-production.service.js';
import { MachineTaskReportDto } from '../common/dto/machine-task-report.dto.js';
import { TimeLog } from '../common/schemas/time-log.schema.js';
import { SparePart } from '../common/schemas/spare-part.schema.js';

export type TaskType =
  | 'inspection'
  | 'maintenance'
  | 'installation'
  | 'production';

export interface UnifiedTask {
  _id: string;
  taskType: TaskType;
  machineName: string;
  machineDetails: string;
  status: string;
  technician: unknown;
  technicianName: string;
  date: Date;
  time?: string;
  scheduledStartTime: Date | null;
  scheduledEndTime: Date | null;
  timeLogs: Array<{ action: string; timestamp: Date; pauseReason: string }>;
  durationMs: number;
  pauseReason: string;
  spareParts?: Array<{ name: string; quantity: number; cost: number }>;
  materialsAndParts?: Array<{ name: string; quantity: number; cost: number }>;
  technicianReport?: string;
  technicianFee: number;
  companyFee: number;
  rejectionReason: string;
  readyForDelivery: boolean;
  machineReception?: unknown;
  customId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TechnicianTasksService {
  constructor(
    private readonly inspectionService: MachineInspectionService,
    private readonly maintenanceService: MachineMaintService,
    private readonly installationService: MachineInstallationService,
    private readonly productionService: MachineProductionService,
  ) {}

  async getAllTasksForTechnician(
    technicianId: Types.ObjectId,
  ): Promise<UnifiedTask[]> {
    const [inspections, maintenances, installations, productions] =
      await Promise.all([
        this.inspectionService.findByTechnician(technicianId),
        this.maintenanceService.findByTechnician(technicianId),
        this.installationService.findByTechnician(technicianId),
        this.productionService.findByTechnician(technicianId),
      ]);

    const tasks: UnifiedTask[] = [
      ...inspections.map((t) =>
        this.toUnified(t.toJSON(), 'inspection', 'inspectionDurationMs'),
      ),
      ...maintenances.map((t) =>
        this.toUnified(t.toJSON(), 'maintenance', 'maintenanceDurationMs'),
      ),
      ...installations.map((t) =>
        this.toUnified(t.toJSON(), 'installation', 'installationDurationMs'),
      ),
      ...productions.map((t) =>
        this.toUnified(t.toJSON(), 'production', 'productionDurationMs'),
      ),
    ];

    return tasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getActiveTasksForTechnician(
    technicianId: Types.ObjectId,
  ): Promise<UnifiedTask[]> {
    const [inspections, maintenances, installations, productions] =
      await Promise.all([
        this.inspectionService.findActiveByTechnician(technicianId),
        this.maintenanceService.findActiveByTechnician(technicianId),
        this.installationService.findActiveByTechnician(technicianId),
        this.productionService.findActiveByTechnician(technicianId),
      ]);

    const tasks: UnifiedTask[] = [
      ...inspections.map((t) =>
        this.toUnified(t.toJSON(), 'inspection', 'inspectionDurationMs'),
      ),
      ...maintenances.map((t) =>
        this.toUnified(t.toJSON(), 'maintenance', 'maintenanceDurationMs'),
      ),
      ...installations.map((t) =>
        this.toUnified(t.toJSON(), 'installation', 'installationDurationMs'),
      ),
      ...productions.map((t) =>
        this.toUnified(t.toJSON(), 'production', 'productionDurationMs'),
      ),
    ];

    return tasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async startTask(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).startWork(id);
  }

  async pauseTask(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
    reason: string,
  ): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).pauseWork(id, reason);
  }

  async resumeTask(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).resumeWork(id);
  }

  async finishTask(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
    report: MachineTaskReportDto,
  ): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).finishWork(id, report);
  }

  async rejectTask(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
    reason: string,
  ): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).rejectTask(id, reason);
  }

  private getService(type: TaskType) {
    switch (type) {
      case 'inspection':
        return this.inspectionService;
      case 'maintenance':
        return this.maintenanceService;
      case 'installation':
        return this.installationService;
      case 'production':
        return this.productionService;
      default:
        throw new NotFoundException(`Unknown task type: ${String(type)}`);
    }
  }

  private async assertOwnership(
    type: TaskType,
    id: Types.ObjectId,
    technicianId: Types.ObjectId,
  ): Promise<void> {
    const service = this.getService(type);
    const task = await service.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    const taskTechId = (task as unknown as Record<string, unknown>)['technician'];
    let techId = '';
    if (taskTechId && typeof taskTechId === 'object') {
      const t = taskTechId as Record<string, unknown>;
      if ('_id' in t) techId = String(t['_id']);
      else if ('id' in t) techId = String(t['id']);
      else techId = '';
    } else {
      if (typeof taskTechId === 'string' || typeof taskTechId === 'number')
        techId = String(taskTechId);
      else techId = '';
    }

    if (!techId || techId !== technicianId.toString()) {
      throw new ForbiddenException('You are not assigned to this task');
    }
  }

  private toUnified(
    doc: unknown,
    taskType: TaskType,
    durationKey: string,
  ): UnifiedTask {
    const d = doc as Record<string, unknown>;
    const rawId = d['_id'] ?? d['id'];
    let id = '';
    if (rawId && typeof rawId === 'object') {
      const r = rawId as Record<string, unknown>;
      if ('_id' in r) id = String(r['_id']);
      else if ('id' in r) id = String(r['id']);
      else id = '';
    } else {
      if (typeof rawId === 'string' || typeof rawId === 'number')
        id = String(rawId);
      else id = '';
    }
    return {
      _id: id,
      taskType,
      machineName: (d['machineName'] as string) ?? '',
      machineDetails: (d['machineDetails'] as string) ?? '',
      status: (d['status'] as string) ?? 'assigned',
      technician: d['technician'],
      technicianName: (d['technicianName'] as string) ?? '',
      date: (d['date'] as Date) ?? new Date(0),
      time: (d['time'] as string) ?? undefined,
      scheduledStartTime: (d['scheduledStartTime'] as Date) ?? null,
      scheduledEndTime: (d['scheduledEndTime'] as Date) ?? null,
      timeLogs: (d['timeLogs'] as TimeLog[]) ?? [],
      durationMs: (d[durationKey] as number) ?? 0,
      pauseReason: (d['pauseReason'] as string) ?? '',
      spareParts: (d['spareParts'] as SparePart[]) ?? undefined,
      materialsAndParts: (d['materialsAndParts'] as SparePart[]) ?? undefined,
      technicianReport: (d['technicianReport'] as string) ?? undefined,
      technicianFee: (d['technicianFee'] as number) ?? 0,
      companyFee: (d['companyFee'] as number) ?? 0,
      rejectionReason: (d['rejectionReason'] as string) ?? '',
      readyForDelivery: (d['readyForDelivery'] as boolean) ?? false,
      machineReception: d['machineReception'],
      customId: (d['customId'] as string) ?? undefined,
      createdAt: (d['createdAt'] as Date) ?? new Date(0),
      updatedAt: (d['updatedAt'] as Date) ?? new Date(0),
    };
  }
}
