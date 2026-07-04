import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { VehicleRepository } from './repositories/vehicle.repository.js';
import { VehicleDocument } from './schemas/vehicle.schema.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly repo: VehicleRepository,
    private readonly idGen: IdGeneratorService,
  ) {}

  async create(dto: CreateVehicleDto): Promise<VehicleDocument> {
    const customId =
      dto.customId || (await this.idGen.generateId(IdPrefix.VEHICLE));
    return this.repo.create({
      customId,
      brandAndModel: dto.brandAndModel,
      plateNumber: dto.plateNumber,
      responsiblePerson: dto.responsiblePerson?.trim() ?? '',
      responsibleUser: dto.responsibleUser
        ? new Types.ObjectId(dto.responsibleUser)
        : undefined,
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<VehicleDocument[]> {
    return this.repo.findAll();
  }
  async findById(id: Types.ObjectId): Promise<VehicleDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Vehicle not found');
    return doc;
  }
  async search(query: string): Promise<VehicleDocument[]> {
    return this.repo.search(query);
  }
  async update(
    id: Types.ObjectId,
    dto: UpdateVehicleDto,
  ): Promise<VehicleDocument> {
    const data: Record<string, unknown> = {};
    if (dto.brandAndModel !== undefined) data.brandAndModel = dto.brandAndModel;
    if (dto.plateNumber !== undefined) data.plateNumber = dto.plateNumber;
    if (dto.responsiblePerson !== undefined)
      data.responsiblePerson = dto.responsiblePerson?.trim() ?? '';
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.responsibleUser !== undefined)
      data.responsibleUser = dto.responsibleUser
        ? new Types.ObjectId(dto.responsibleUser)
        : null;
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Vehicle not found');
    return updated;
  }
  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Vehicle not found');
  }
}
