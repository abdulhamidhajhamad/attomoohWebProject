import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineProductionRepository } from './repositories/machine-production.repository.js';
import { MachineProductionDocument } from './schemas/machine-production.schema.js';
import { CreateMachineProductionDto } from './dto/create-machine-production.dto.js';
import { UpdateMachineProductionDto } from './dto/update-machine-production.dto.js';
import { IdGeneratorService } from '../../common/services/id-generator.service.js';
import { IdPrefix } from '../../common/enums/id-prefix.enum.js';
import { MachineTaskReportDto } from '../../common/dto/machine-task-report.dto.js';

@Injectable()
export class MachineProductionService {
  constructor(
    private readonly repo: MachineProductionRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(
    dto: CreateMachineProductionDto,
  ): Promise<MachineProductionDocument> {
    const customId = dto.customId?.trim() || (await this.idGenerator.generateId(IdPrefix.PRODUCTION));
    const machineName = dto.machineName?.trim() ?? '';
    const machineDetails = dto.machineDetails?.trim() ?? '';
    const machineNameAndDetails = dto.machineNameAndDetails?.trim() || [machineName, machineDetails].filter(Boolean).join(' - ');

    if (!machineNameAndDetails) {
      throw new BadRequestException('Machine name/details is required');
    }

    return this.repo.create({
      customId,
      machineName,
      machineDetails,
      machineNameAndDetails,
      pauseReason: dto.pauseReason ?? '',
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      technicianName: dto.technicianName ?? '',
      materialsAndParts: (dto.materialsAndParts ?? []).map((part) => ({
        name: part.name,
        quantity: part.quantity ?? 1,
        cost: part.cost ?? 0,
      })) as any,
      readyForDelivery: dto.readyForDelivery ?? false,
      technicianFee: dto.technicianFee ?? 0,
      companyFee: dto.companyFee ?? 0,
    });
  }

  async findAll(search?: string): Promise<MachineProductionDocument[]> {
    return this.repo.findAll({ search });
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument> {
    const d = await this.repo.findById(id);
    if (!d)
      throw new NotFoundException('Production record not found');
    return d;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateMachineProductionDto,
  ): Promise<MachineProductionDocument> {
    const data: Record<string, unknown> = { ...dto };

    if (dto.customId !== undefined) data.customId = dto.customId.trim();

    if (dto.technician !== undefined)
      data.technician = dto.technician
        ? new Types.ObjectId(dto.technician)
        : null;

    if (dto.technician !== undefined && dto.technician) data.technicianName = '';
    if (dto.technician === undefined && dto.technicianName !== undefined) data.technician = null;

    if (dto.materialsAndParts !== undefined) {
      data.materialsAndParts = dto.materialsAndParts.map((part) => ({
        name: part.name,
        quantity: part.quantity ?? 1,
        cost: part.cost ?? 0,
      }));
    }

    const hasName = dto.machineName !== undefined;
    const hasDetails = dto.machineDetails !== undefined;
    const hasCombined = dto.machineNameAndDetails !== undefined;

    if (hasName || hasDetails || hasCombined) {
      const current = await this.findById(id);
      const machineName = (dto.machineName ?? current.machineName ?? '').trim();
      const machineDetails = (dto.machineDetails ?? current.machineDetails ?? '').trim();
      const combined = dto.machineNameAndDetails?.trim() || [machineName, machineDetails].filter(Boolean).join(' - ');
      data.machineName = machineName;
      data.machineDetails = machineDetails;
      data.machineNameAndDetails = combined;
    }

    const u = await this.repo.updateById(id, data as any);
    if (!u)
      throw new NotFoundException('Production record not found');
    return u;
  }

  async startWork(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'start',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    (d as any).status = 'in_progress';
    return d.save();
  }

  async pauseWork(
    id: Types.ObjectId,
    reason: string,
  ): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'pause',
      timestamp: new Date(),
      pauseReason: reason ?? '',
    } as any);
    (d as any).status = 'postponed';
    return d.save();
  }

  async resumeWork(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'resume',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    (d as any).status = 'in_progress';
    return d.save();
  }

  async finishWork(
    id: Types.ObjectId,
    report?: MachineTaskReportDto,
  ): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.readyForDelivery = true;
    (d as any).status = 'ready';
    d.productionDurationMs = this.calcDuration(d.timeLogs as any);

    if (report) {
      if (report.pauseReason !== undefined) d.pauseReason = report.pauseReason;
      if (report.spareParts !== undefined) d.materialsAndParts = report.spareParts as any;
      if (report.technicianFee !== undefined) d.technicianFee = report.technicianFee;
      if (report.companyFee !== undefined) d.companyFee = report.companyFee;
    }

    return d.save();
  }

  async rejectTask(id: Types.ObjectId, reason: string): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    (d as any).status = 'rejected';
    (d as any).rejectionReason = reason;
    d.timeLogs.push({ action: 'reject', timestamp: new Date(), pauseReason: reason } as any);
    return d.save();
  }

  async findByTechnician(technicianId: Types.ObjectId): Promise<MachineProductionDocument[]> {
    return this.repo.findByTechnician(technicianId);
  }

  async findActiveByTechnician(technicianId: Types.ObjectId): Promise<MachineProductionDocument[]> {
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
