import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AreaRepository } from './repositories/area.repository.js';
import { AreaDocument } from './schemas/area.schema.js';
import { CreateAreaDto } from './dto/create-area.dto.js';
import { UpdateAreaDto } from './dto/update-area.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class AreasService {
  constructor(
    private readonly areaRepo: AreaRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateAreaDto): Promise<AreaDocument> {
    const customId =
      dto.customId || (await this.idGenerator.generateId(IdPrefix.AREA));
    return this.areaRepo.create({
      customId,
      name: dto.name,
      phonePrefix: dto.phonePrefix ?? '',
      notes: dto.notes ?? '',
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<AreaDocument[]> {
    return this.areaRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<AreaDocument> {
    const area = await this.areaRepo.findById(id);
    if (!area) throw new NotFoundException('Area not found');
    return area;
  }

  async search(query: string): Promise<AreaDocument[]> {
    return this.areaRepo.search(query);
  }

  async update(id: Types.ObjectId, dto: UpdateAreaDto): Promise<AreaDocument> {
    const updated = await this.areaRepo.updateById(id, dto);
    if (!updated) throw new NotFoundException('Area not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.areaRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Area not found');
  }
}
