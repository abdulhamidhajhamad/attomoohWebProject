import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineReceptionRepository } from './repositories/machine-reception.repository.js';
import { MachineReceptionDocument } from './schemas/machine-reception.schema.js';
import { CreateMachineReceptionDto } from './dto/create-machine-reception.dto.js';
import { UpdateMachineReceptionDto } from './dto/update-machine-reception.dto.js';
import { IdGeneratorService } from '../../common/services/id-generator.service.js';
import { IdPrefix } from '../../common/enums/id-prefix.enum.js';
import { ReceptionStatus } from '../../common/enums/reception-status.enum.js';

@Injectable()
export class MachineReceptionService {
  constructor(
    private readonly repo: MachineReceptionRepository,
    private readonly idGen: IdGeneratorService,
  ) {}

  async create(dto: CreateMachineReceptionDto): Promise<MachineReceptionDocument> {
    const customId = dto.customId || (await this.idGen.generateId(IdPrefix.RECEPTION));
    const receivedBy = dto.receivedBy ? new Types.ObjectId(dto.receivedBy) : undefined;
    return this.repo.create({
      customId,
      machine: dto.machine ? new Types.ObjectId(dto.machine) : undefined,
      machineDetails: dto.machineDetails ?? '',
      serialNumber: dto.serialNumber ?? '',
      customer: dto.customer ? new Types.ObjectId(dto.customer) : undefined,
      customerName: dto.customerName ?? '',
      customerPhone: dto.customerPhone ?? '',
      customerAddress: dto.customerAddress ?? '',
      warranty: dto.warranty ?? false,
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      condition: dto.condition ?? 'complete',
      receivedParts: dto.receivedParts ?? '',
      customerProblemDesc: dto.customerProblemDesc ?? '',
      notes: dto.notes ?? '',
      receivedBy,
      receivedByName: receivedBy ? '' : (dto.receivedByName ?? ''),
    });
  }

  async findAll(status?: string): Promise<MachineReceptionDocument[]> {
    if (status) return this.repo.findByStatus(status);
    return this.repo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<MachineReceptionDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Machine reception not found');
    return doc;
  }

  async update(id: Types.ObjectId, dto: UpdateMachineReceptionDto): Promise<MachineReceptionDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.machine !== undefined) data.machine = dto.machine ? new Types.ObjectId(dto.machine) : undefined;
    if (dto.customer !== undefined) data.customer = dto.customer ? new Types.ObjectId(dto.customer) : undefined;
    if (dto.receivedBy !== undefined) {
      if (dto.receivedBy) {
        data.receivedBy = new Types.ObjectId(dto.receivedBy);
        data.receivedByName = '';
      } else {
        data.receivedBy = undefined;
        data.receivedByName = dto.receivedByName ?? '';
      }
    }
    if (dto.receivedByName !== undefined && dto.receivedBy === undefined) {
      // Update manual name without touching the linked employee
      data.receivedByName = dto.receivedByName;
    }
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : undefined;
    if (dto.expectedDeliveryDate !== undefined) data.expectedDeliveryDate = dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined;
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Machine reception not found');
    return updated;
  }

  async startWork(id: Types.ObjectId): Promise<MachineReceptionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({ action: 'start', timestamp: new Date(), pauseReason: '' } as any);
    doc.status = ReceptionStatus.IN_MAINTENANCE;
    return doc.save();
  }

  async pauseWork(id: Types.ObjectId, reason: string): Promise<MachineReceptionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({ action: 'pause', timestamp: new Date(), pauseReason: reason ?? '' } as any);
    doc.status = ReceptionStatus.POSTPONED;
    return doc.save();
  }

  async resumeWork(id: Types.ObjectId): Promise<MachineReceptionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({ action: 'resume', timestamp: new Date(), pauseReason: '' } as any);
    doc.status = ReceptionStatus.IN_MAINTENANCE;
    return doc.save();
  }

  async finishWork(id: Types.ObjectId): Promise<MachineReceptionDocument> {
    const doc = await this.findById(id);
    doc.timeLogs.push({ action: 'finish', timestamp: new Date(), pauseReason: '' } as any);
    doc.status = ReceptionStatus.READY;
    doc.totalDurationMs = this.calculateDuration(doc.timeLogs as any);
    return doc.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Machine reception not found');
  }

  private calculateDuration(logs: Array<{ action: string; timestamp: Date }>): number {
    let total = 0;
    let startTime: Date | null = null;
    for (const log of logs) {
      if (log.action === 'start' || log.action === 'resume') {
        startTime = new Date(log.timestamp);
      } else if ((log.action === 'pause' || log.action === 'finish') && startTime) {
        total += new Date(log.timestamp).getTime() - startTime.getTime();
        startTime = null;
      }
    }
    return total;
  }
}
