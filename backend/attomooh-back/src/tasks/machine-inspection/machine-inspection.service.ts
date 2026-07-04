import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineInspectionRepository } from './repositories/machine-inspection.repository.js';
import {
  MachineInspection,
  MachineInspectionDocument,
} from './schemas/machine-inspection.schema.js';
import { CreateMachineInspectionDto } from './dto/create-machine-inspection.dto.js';
import { UpdateMachineInspectionDto } from './dto/update-machine-inspection.dto.js';
import { InspectionStatus } from '../../common/enums/inspection-status.enum.js';
import { MachineTaskReportDto } from '../../common/dto/machine-task-report.dto.js';
import { SparePart } from '../../common/schemas/spare-part.schema.js';
import { TimeLog } from '../../common/schemas/time-log.schema.js';

@Injectable()
export class MachineInspectionService {
  constructor(private readonly repo: MachineInspectionRepository) {}

  async create(
    dto: CreateMachineInspectionDto,
  ): Promise<MachineInspectionDocument> {
    const status = dto.status ?? InspectionStatus.IN_PROGRESS;
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      pauseReason: dto.pauseReason ?? '',
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      technicianName: dto.technicianName ?? '',
      spareParts: (dto.spareParts ?? []).map(
        (part): SparePart => ({
          name: part.name,
          quantity: part.quantity ?? 1,
          cost: part.cost ?? 0,
        }),
      ),
      technicianReport: dto.technicianReport ?? '',
      status,
      readyForDelivery: status === InspectionStatus.READY,
      technicianFee: dto.technicianFee ?? 0,
      companyFee: dto.companyFee ?? 0,
      scheduledStartTime: dto.scheduledStartTime
        ? new Date(dto.scheduledStartTime)
        : null,
      scheduledEndTime: dto.scheduledEndTime
        ? new Date(dto.scheduledEndTime)
        : null,
    });
  }

  async findAll(
    status?: string,
    search?: string,
  ): Promise<MachineInspectionDocument[]> {
    return this.repo.findAll({ status, search });
  }

  async findById(id: Types.ObjectId): Promise<MachineInspectionDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Machine inspection not found');
    return doc;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateMachineInspectionDto,
  ): Promise<MachineInspectionDocument> {
    const data: Partial<MachineInspection> = {};
    if (dto.machineReception !== undefined) {
      data.machineReception = new Types.ObjectId(dto.machineReception);
    }
    if (dto.machineName !== undefined) data.machineName = dto.machineName;
    if (dto.machineDetails !== undefined) data.machineDetails = dto.machineDetails;
    if (dto.pauseReason !== undefined) data.pauseReason = dto.pauseReason;
    if (dto.technician !== undefined) {
      data.technician = dto.technician ? new Types.ObjectId(dto.technician) : null;
      if (dto.technician) data.technicianName = '';
    }
    if (dto.technicianName !== undefined) data.technicianName = dto.technicianName;
    if (dto.technician === undefined && dto.technicianName !== undefined)
      data.technician = null;
    if (dto.status !== undefined)
      data.readyForDelivery = dto.status === InspectionStatus.READY;
    if (dto.scheduledStartTime !== undefined)
      data.scheduledStartTime = dto.scheduledStartTime
        ? new Date(dto.scheduledStartTime)
        : null;
    if (dto.scheduledEndTime !== undefined)
      data.scheduledEndTime = dto.scheduledEndTime
        ? new Date(dto.scheduledEndTime)
        : null;
    if (dto.spareParts !== undefined)
      data.spareParts = dto.spareParts.map((part) => ({
        name: part.name,
        quantity: part.quantity ?? 1,
        cost: part.cost ?? 0,
      }));
    if (dto.technicianReport !== undefined) data.technicianReport = dto.technicianReport;
    if (dto.technicianFee !== undefined) data.technicianFee = dto.technicianFee;
    if (dto.companyFee !== undefined) data.companyFee = dto.companyFee;
    const updated = await this.repo.updateById(id, data);
    if (!updated) throw new NotFoundException('Machine inspection not found');
    return updated;
  }

  async startWork(id: Types.ObjectId): Promise<MachineInspectionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({
      action: 'start',
      timestamp: new Date(),
      pauseReason: '',
    } as TimeLog);
    doc.status = InspectionStatus.IN_PROGRESS;
    return doc.save();
  }

  async pauseWork(
    id: Types.ObjectId,
    reason: string,
  ): Promise<MachineInspectionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({
      action: 'pause',
      timestamp: new Date(),
      pauseReason: reason ?? '',
    } as TimeLog);
    doc.status = InspectionStatus.POSTPONED;
    return doc.save();
  }

  async resumeWork(id: Types.ObjectId): Promise<MachineInspectionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({
      action: 'resume',
      timestamp: new Date(),
      pauseReason: '',
    } as TimeLog);
    doc.status = InspectionStatus.IN_PROGRESS;
    return doc.save();
  }

  async finishWork(
    id: Types.ObjectId,
    report?: MachineTaskReportDto,
  ): Promise<MachineInspectionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as TimeLog);
    doc.inspectionDurationMs = this.calculateDuration(doc.timeLogs);
    doc.status = InspectionStatus.READY;
    doc.readyForDelivery = true;

    if (report) {
      if (report.pauseReason !== undefined)
        doc.pauseReason = report.pauseReason;
      if (report.spareParts !== undefined)
        doc.spareParts = report.spareParts as SparePart[];
      if (report.technicianReport !== undefined)
        doc.technicianReport = report.technicianReport;
      if (report.technicianFee !== undefined)
        doc.technicianFee = report.technicianFee;
      if (report.companyFee !== undefined) doc.companyFee = report.companyFee;
    }

    return doc.save();
  }

  async rejectTask(
    id: Types.ObjectId,
    reason: string,
  ): Promise<MachineInspectionDocument> {
    const doc = await this.findById(id);
    doc.status = InspectionStatus.REJECTED;
    doc.rejectionReason = reason;
    doc.timeLogs.push({
      action: 'reject',
      timestamp: new Date(),
      pauseReason: reason,
    } as TimeLog);
    return doc.save();
  }

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineInspectionDocument[]> {
    return this.repo.findByTechnician(technicianId);
  }

  async findActiveByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<MachineInspectionDocument[]> {
    return this.repo.findActiveByTechnician(technicianId);
  }

  async delete(id: Types.ObjectId): Promise<void> {
    // Idempotent delete: if record is already gone, treat as success.
    await this.repo.deleteById(id);
  }

  private calculateDuration(logs: TimeLog[]): number {
    let total = 0;
    let startTime: Date | null = null;
    for (const log of logs) {
      if (log.action === 'start' || log.action === 'resume')
        startTime = new Date(log.timestamp);
      else if (
        (log.action === 'pause' || log.action === 'finish') &&
        startTime
      ) {
        total += new Date(log.timestamp).getTime() - startTime.getTime();
        startTime = null;
      }
    }
    return total;
  }
}
