import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineProductionRepository } from './repositories/machine-production.repository.js';
import { MachineProductionDocument } from './schemas/machine-production.schema.js';
import { CreateMachineProductionDto } from './dto/create-machine-production.dto.js';
import { UpdateMachineProductionDto } from './dto/update-machine-production.dto.js';
import { IdGeneratorService } from '../../common/services/id-generator.service.js';
import { IdPrefix } from '../../common/enums/id-prefix.enum.js';

@Injectable()
export class MachineProductionService {
  constructor(
    private readonly repo: MachineProductionRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(
    dto: CreateMachineProductionDto,
  ): Promise<MachineProductionDocument> {
    const customId = await this.idGenerator.generateId(IdPrefix.PRODUCTION);
    return this.repo.create({
      customId,
      machineNameAndDetails: dto.machineNameAndDetails,
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      technicianName: dto.technicianName ?? '',
      materialsAndParts: (dto.materialsAndParts ?? []) as any,
      readyForDelivery: dto.readyForDelivery ?? false,
      technicianFee: dto.technicianFee ?? 0,
      companyFee: dto.companyFee ?? 0,
    });
  }

  async findAll(): Promise<MachineProductionDocument[]> {
    return this.repo.findAll();
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
    if (dto.technician !== undefined)
      data.technician = dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined;
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
    return d.save();
  }

  async finishWork(
    id: Types.ObjectId,
  ): Promise<MachineProductionDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.readyForDelivery = true;
    d.productionDurationMs = this.calcDuration(d.timeLogs as any);
    return d.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const d = await this.repo.deleteById(id);
    if (!d)
      throw new NotFoundException('Production record not found');
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
