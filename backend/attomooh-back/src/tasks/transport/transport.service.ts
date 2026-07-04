import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransportRepository } from './repositories/transport.repository.js';
import { TransportDocument } from './schemas/transport.schema.js';
import { CreateTransportDto } from './dto/create-transport.dto.js';
import { UpdateTransportDto } from './dto/update-transport.dto.js';

@Injectable()
export class TransportService {
  constructor(private readonly repo: TransportRepository) {}

  async create(dto: CreateTransportDto): Promise<TransportDocument> {
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      pauseReason: dto.pauseReason ?? '',
      logistic: dto.logistic ? new Types.ObjectId(dto.logistic) : undefined,
      logisticName: dto.logisticName ?? '',
      logisticReport: dto.logisticReport ?? '',
      readyForDelivery: dto.readyForDelivery ?? false,
      logisticFee: dto.logisticFee ?? 0,
      companyFee: dto.companyFee ?? 0,
    });
  }

  async findAll(search?: string): Promise<TransportDocument[]> {
    return this.repo.findAll({ search });
  }
  async findById(id: Types.ObjectId): Promise<TransportDocument> {
    const d = await this.repo.findById(id);
    if (!d) throw new NotFoundException('Transport not found');
    return d;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateTransportDto,
  ): Promise<TransportDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.machineReception !== undefined)
      data.machineReception = new Types.ObjectId(dto.machineReception);
    if (dto.logistic !== undefined)
      data.logistic = dto.logistic ? new Types.ObjectId(dto.logistic) : null;
    if (dto.logistic !== undefined && dto.logistic) data.logisticName = '';
    if (dto.logistic === undefined && dto.logisticName !== undefined)
      data.logistic = null;
    const u = await this.repo.updateById(id, data as any);
    if (!u) throw new NotFoundException('Transport not found');
    return u;
  }

  async startWork(id: Types.ObjectId): Promise<TransportDocument> {
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
  ): Promise<TransportDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'pause',
      timestamp: new Date(),
      pauseReason: reason ?? '',
    } as any);
    return d.save();
  }
  async resumeWork(id: Types.ObjectId): Promise<TransportDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'resume',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    return d.save();
  }
  async finishWork(id: Types.ObjectId): Promise<TransportDocument> {
    const d = await this.findById(id);
    d.timeLogs.push({
      action: 'finish',
      timestamp: new Date(),
      pauseReason: '',
    } as any);
    d.transportDurationMs = this.calcDuration(d.timeLogs as any);
    return d.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.repo.deleteById(id);
  }

  private calcDuration(
    logs: Array<{ action: string; timestamp: Date }>,
  ): number {
    let total = 0,
      start: Date | null = null;
    for (const l of logs) {
      if (l.action === 'start' || l.action === 'resume')
        start = new Date(l.timestamp);
      else if ((l.action === 'pause' || l.action === 'finish') && start) {
        total += new Date(l.timestamp).getTime() - start.getTime();
        start = null;
      }
    }
    return total;
  }
}
