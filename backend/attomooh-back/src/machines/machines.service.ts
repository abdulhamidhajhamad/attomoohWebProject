import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineRepository } from './repositories/machine.repository.js';
import { MachineDocument } from './schemas/machine.schema.js';
import { CreateMachineDto } from './dto/create-machine.dto.js';
import { UpdateMachineDto } from './dto/update-machine.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class MachinesService {
  constructor(
    private readonly machineRepo: MachineRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateMachineDto): Promise<MachineDocument> {
    const customId = dto.customId || (await this.idGenerator.generateId(IdPrefix.MACHINE));
    return this.machineRepo.create({
      customId,
      name: dto.name,
      technician1: dto.technician1 ? new Types.ObjectId(dto.technician1) : undefined,
      technician2: dto.technician2 ? new Types.ObjectId(dto.technician2) : undefined,
      technician3: dto.technician3 ? new Types.ObjectId(dto.technician3) : undefined,
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<MachineDocument[]> {
    return this.machineRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<MachineDocument> {
    const machine = await this.machineRepo.findById(id);
    if (!machine) throw new NotFoundException('Machine not found');
    return machine;
  }

  async search(query: string): Promise<MachineDocument[]> {
    return this.machineRepo.search(query);
  }

  async update(id: Types.ObjectId, dto: UpdateMachineDto): Promise<MachineDocument> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.technician1 !== undefined) data.technician1 = dto.technician1 ? new Types.ObjectId(dto.technician1) : undefined;
    if (dto.technician2 !== undefined) data.technician2 = dto.technician2 ? new Types.ObjectId(dto.technician2) : undefined;
    if (dto.technician3 !== undefined) data.technician3 = dto.technician3 ? new Types.ObjectId(dto.technician3) : undefined;
    const updated = await this.machineRepo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Machine not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.machineRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Machine not found');
  }
}
