import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineInspectionService } from '../tasks/machine-inspection/machine-inspection.service.js';
import { MachineMaintService } from '../tasks/machine-maintenance/machine-maint.service.js';
import { MachineInstallationService } from '../tasks/machine-installation/machine-installation.service.js';
import { MachineProductionService } from '../tasks/machine-production/machine-production.service.js';
import { MachineTaskReportDto } from '../common/dto/machine-task-report.dto.js';

export type TaskType = 'inspection' | 'maintenance' | 'installation' | 'production';

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

  async getAllTasksForTechnician(technicianId: Types.ObjectId): Promise<UnifiedTask[]> {
    const [inspections, maintenances, installations, productions] = await Promise.all([
      this.inspectionService.findByTechnician(technicianId),
      this.maintenanceService.findByTechnician(technicianId),
      this.installationService.findByTechnician(technicianId),
      this.productionService.findByTechnician(technicianId),
    ]);

    const tasks: UnifiedTask[] = [
      ...inspections.map((t) => this.toUnified(t.toJSON(), 'inspection', 'inspectionDurationMs')),
      ...maintenances.map((t) => this.toUnified(t.toJSON(), 'maintenance', 'maintenanceDurationMs')),
      ...installations.map((t) => this.toUnified(t.toJSON(), 'installation', 'installationDurationMs')),
      ...productions.map((t) => this.toUnified(t.toJSON(), 'production', 'productionDurationMs')),
    ];

    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActiveTasksForTechnician(technicianId: Types.ObjectId): Promise<UnifiedTask[]> {
    const [inspections, maintenances, installations, productions] = await Promise.all([
      this.inspectionService.findActiveByTechnician(technicianId),
      this.maintenanceService.findActiveByTechnician(technicianId),
      this.installationService.findActiveByTechnician(technicianId),
      this.productionService.findActiveByTechnician(technicianId),
    ]);

    const tasks: UnifiedTask[] = [
      ...inspections.map((t) => this.toUnified(t.toJSON(), 'inspection', 'inspectionDurationMs')),
      ...maintenances.map((t) => this.toUnified(t.toJSON(), 'maintenance', 'maintenanceDurationMs')),
      ...installations.map((t) => this.toUnified(t.toJSON(), 'installation', 'installationDurationMs')),
      ...productions.map((t) => this.toUnified(t.toJSON(), 'production', 'productionDurationMs')),
    ];

    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async startTask(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).startWork(id);
  }

  async pauseTask(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId, reason: string): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).pauseWork(id, reason);
  }

  async resumeTask(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).resumeWork(id);
  }

  async finishTask(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId, report: MachineTaskReportDto): Promise<unknown> {
    await this.assertOwnership(type, id, technicianId);
    return this.getService(type).finishWork(id, report);
  }

  async rejectTask(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId, reason: string): Promise<unknown> {
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
        throw new NotFoundException(`Unknown task type: ${type}`);
    }
  }

  private async assertOwnership(type: TaskType, id: Types.ObjectId, technicianId: Types.ObjectId): Promise<void> {
    const service = this.getService(type);
    const task = await service.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    const taskTechId = (task as any).technician;
    const techId = taskTechId && typeof taskTechId === 'object' && '_id' in taskTechId
      ? String((taskTechId as { _id: Types.ObjectId })._id)
      : String(taskTechId ?? '');

    if (!techId || techId !== technicianId.toString()) {
      throw new ForbiddenException('You are not assigned to this task');
    }
  }

  private toUnified(doc: any, taskType: TaskType, durationKey: string): UnifiedTask {
    return {
      _id: doc._id?.toString() ?? doc.id,
      taskType,
      machineName: doc.machineName ?? '',
      machineDetails: doc.machineDetails ?? '',
      status: doc.status ?? 'assigned',
      technician: doc.technician,
      technicianName: doc.technicianName ?? '',
      date: doc.date,
      time: doc.time,
      scheduledStartTime: doc.scheduledStartTime ?? null,
      scheduledEndTime: doc.scheduledEndTime ?? null,
      timeLogs: doc.timeLogs ?? [],
      durationMs: doc[durationKey] ?? 0,
      pauseReason: doc.pauseReason ?? '',
      spareParts: doc.spareParts,
      materialsAndParts: doc.materialsAndParts,
      technicianReport: doc.technicianReport,
      technicianFee: doc.technicianFee ?? 0,
      companyFee: doc.companyFee ?? 0,
      rejectionReason: doc.rejectionReason ?? '',
      readyForDelivery: doc.readyForDelivery ?? false,
      machineReception: doc.machineReception,
      customId: doc.customId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
