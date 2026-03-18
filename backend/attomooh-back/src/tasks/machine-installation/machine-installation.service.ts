import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineInstallationRepository } from './repositories/machine-installation.repository.js';
import { MachineInstallationDocument } from './schemas/machine-installation.schema.js';
import { CreateMachineInstallationDto } from './dto/create-machine-installation.dto.js';
import { UpdateMachineInstallationDto } from './dto/update-machine-installation.dto.js';
import { InstallationStatus } from '../../common/enums/installation-status.enum.js';

@Injectable()
export class MachineInstallationService {
  constructor(private readonly repo: MachineInstallationRepository) {}

  async create(
    dto: CreateMachineInstallationDto,
  ): Promise<MachineInstallationDocument> {
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      time: dto.time ?? '',
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      technicianName: dto.technicianName ?? '',
      technicianReport: dto.technicianReport ?? '',
      technicianFee: dto.technicianFee ?? 0,
      companyFee: dto.companyFee ?? 0,
    });
  }

  async findAll(status?: string): Promise<MachineInstallationDocument[]> {
    return this.repo.findAll(status ? { status } : {});
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument> {
    const d = await this.repo.findById(id);
    if (!d)
      throw new NotFoundException('Installation record not found');
    return d;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateMachineInstallationDto,
  ): Promise<MachineInstallationDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.technician !== undefined)
      data.technician = dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined;
    const u = await this.repo.updateById(id, data as any);
    if (!u)
      throw new NotFoundException('Installation record not found');
    return u;
  }

  async startWork(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'start',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = InstallationStatus.POSTPONED;
    return d.save();
  }

  async pauseWork(
    id: Types.ObjectId,
    reason: string,
  ): Promise<MachineInstallationDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'pause',
      timestamp: new Date(),
      pauseReason: reason ?? '',
    } as any);
    d.status = InstallationStatus.POSTPONED;
    return d.save();
  }

  async resumeWork(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'resume',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = InstallationStatus.POSTPONED;
    return d.save();
  }

  async finishWork(
    id: Types.ObjectId,
  ): Promise<MachineInstallationDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.status = InstallationStatus.READY;
    d.installationDurationMs = this.calcDuration(d.timeLogs as any);
    return d.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const d = await this.repo.deleteById(id);
    if (!d)
      throw new NotFoundException('Installation record not found');
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
