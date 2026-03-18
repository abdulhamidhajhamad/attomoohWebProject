import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MachineTypeRepository } from './repositories/machine-type.repository.js';
import { MachineTypeDocument } from './schemas/machine-type.schema.js';
import { CreateMachineTypeDto } from './dto/create-machine-type.dto.js';
import { UpdateMachineTypeDto } from './dto/update-machine-type.dto.js';

@Injectable()
export class MachineTypesService {
  constructor(private readonly machineTypeRepo: MachineTypeRepository) {}

  async create(dto: CreateMachineTypeDto): Promise<MachineTypeDocument> {
    return this.machineTypeRepo.create({
      name: dto.name,
      description: dto.description ?? '',
    });
  }

  async findAll(): Promise<MachineTypeDocument[]> {
    return this.machineTypeRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<MachineTypeDocument> {
    const mt = await this.machineTypeRepo.findById(id);
    if (!mt) throw new NotFoundException('Machine type not found');
    return mt;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateMachineTypeDto,
  ): Promise<MachineTypeDocument> {
    const updated = await this.machineTypeRepo.updateById(id, dto);
    if (!updated) throw new NotFoundException('Machine type not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.machineTypeRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Machine type not found');
  }
}
