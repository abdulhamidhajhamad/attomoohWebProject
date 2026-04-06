import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineMaintRepository } from './repositories/machine-maint.repository.js';
import { MachineMaintDocument } from './schemas/machine-maint.schema.js';
import { CreateMachineMaintDto } from './dto/create-machine-maint.dto.js';
import { UpdateMachineMaintDto } from './dto/update-machine-maint.dto.js';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MachineTaskReportDto } from '../../common/dto/machine-task-report.dto.js';

@Injectable()
export class MachineMaintService {
  constructor(private readonly repo: MachineMaintRepository) {}

  async create(dto: CreateMachineMaintDto): Promise<MachineMaintDocument> {
    const status = dto.status ?? MaintenanceStatus.WAITING;
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      pauseReason: dto.pauseReason ?? '',
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      technicianName: dto.technicianName ?? '',
      spareParts: (dto.spareParts ?? []).map((part) => ({
        name: part.name,
        quantity: part.quantity ?? 1,
        cost: part.cost ?? 0,
      })) as any,
      technicianReport: dto.technicianReport ?? '',
      status,
      readyForDelivery: status === MaintenanceStatus.READY,
      technicianFee: dto.technicianFee ?? 0,
      companyFee: dto.companyFee ?? 0,
    });
  }

  async findAll(status?: string, search?: string): Promise<MachineMaintDocument[]> {
    return this.repo.findAll({ status, search });
  }

  async findById(id: Types.ObjectId): Promise<MachineMaintDocument> {
    const d = await this.repo.findById(id);
    if (!d) throw new NotFoundException('Maintenance record not found');
    return d;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateMachineMaintDto,
  ): Promise<MachineMaintDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.machineReception !== undefined) data.machineReception = new Types.ObjectId(dto.machineReception);
    if (dto.technician !== undefined)
      data.technician = dto.technician
        ? new Types.ObjectId(dto.technician)
        : null;
    if (dto.technician !== undefined && dto.technician) data.technicianName = '';
    if (dto.technician === undefined && dto.technicianName !== undefined) data.technician = null;
    if (dto.status !== undefined) data.readyForDelivery = dto.status === MaintenanceStatus.READY;
    if (dto.spareParts !== undefined) {
      data.spareParts = dto.spareParts.map((part) => ({
        name: part.name,
        quantity: part.quantity ?? 1,
        cost: part.cost ?? 0,
      }));
    }
    const u = await this.repo.updateById(id, data as any);
    if (!u) throw new NotFoundException('Maintenance record not found');
    return u;
  }

  async startWork(id: Types.ObjectId): Promise<MachineMaintDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'start',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = MaintenanceStatus.IN_MAINTENANCE;
    return d.save();
  }

  async pauseWork(
    id: Types.ObjectId,
    reason: string,
  ): Promise<MachineMaintDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'pause',
      timestamp: new Date(),
      pauseReason: reason ?? '',
    } as any);
    d.status = MaintenanceStatus.POSTPONED;
    return d.save();
  }

  async resumeWork(id: Types.ObjectId): Promise<MachineMaintDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'resume',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = MaintenanceStatus.IN_MAINTENANCE;
    return d.save();
  }

  async finishWork(id: Types.ObjectId, report?: MachineTaskReportDto): Promise<MachineMaintDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = MaintenanceStatus.READY;
    d.readyForDelivery = true;
    d.maintenanceDurationMs = this.calcDuration(d.timeLogs as any);

    if (report) {
      if (report.pauseReason !== undefined) d.pauseReason = report.pauseReason;
      if (report.spareParts !== undefined) d.spareParts = report.spareParts as any;
      if (report.technicianReport !== undefined) d.technicianReport = report.technicianReport;
      if (report.technicianFee !== undefined) d.technicianFee = report.technicianFee;
      if (report.companyFee !== undefined) d.companyFee = report.companyFee;
    }

    return d.save();
  }

  async rejectTask(id: Types.ObjectId, reason: string): Promise<MachineMaintDocument> {
    const d = await this.findById(id);
    d.status = MaintenanceStatus.REJECTED;
    (d as any).rejectionReason = reason;
    d.timeLogs.push({ action: 'reject', timestamp: new Date(), pauseReason: reason } as any);
    return d.save();
  }

  async findByTechnician(technicianId: Types.ObjectId): Promise<MachineMaintDocument[]> {
    return this.repo.findByTechnician(technicianId);
  }

  async findActiveByTechnician(technicianId: Types.ObjectId): Promise<MachineMaintDocument[]> {
    return this.repo.findActiveByTechnician(technicianId);
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.repo.deleteById(id);
  }

  private calcDuration(
    logs: Array<{ action: string; timestamp: Date }>,
  ): number {
    let total = 0;
    let start: Date | null = null;
    for (const l of logs) {
      if (l.action === 'start' || l.action === 'resume')
        start = new Date(l.timestamp);
      else if (
        (l.action === 'pause' || l.action === 'finish') &&
        start
      ) {
        total += new Date(l.timestamp).getTime() - start.getTime();
        start = null;
      }
    }
    return total;
  }
}
