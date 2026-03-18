import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineDeliveryRepository } from './repositories/machine-delivery.repository.js';
import { MachineDeliveryDocument } from './schemas/machine-delivery.schema.js';
import { CreateMachineDeliveryDto } from './dto/create-machine-delivery.dto.js';
import { UpdateMachineDeliveryDto } from './dto/update-machine-delivery.dto.js';

@Injectable()
export class MachineDeliveryService {
  constructor(private readonly repo: MachineDeliveryRepository) {}

  async create(dto: CreateMachineDeliveryDto): Promise<MachineDeliveryDocument> {
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      customerName: dto.customerName ?? '',
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
      notes: dto.notes ?? '',
      deliveredBy: dto.deliveredBy ? new Types.ObjectId(dto.deliveredBy) : undefined,
    });
  }

  async findAll(): Promise<MachineDeliveryDocument[]> { return this.repo.findAll(); }

  async findById(id: Types.ObjectId): Promise<MachineDeliveryDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Machine delivery not found');
    return doc;
  }

  async update(id: Types.ObjectId, dto: UpdateMachineDeliveryDto): Promise<MachineDeliveryDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.deliveredBy !== undefined) data.deliveredBy = dto.deliveredBy ? new Types.ObjectId(dto.deliveredBy) : undefined;
    if (dto.deliveryDate !== undefined) data.deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : new Date();
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Machine delivery not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Machine delivery not found');
  }
}
