import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ToolRepository } from './repositories/tool.repository.js';
import { ToolDocument } from './schemas/tool.schema.js';
import { CreateToolDto } from './dto/create-tool.dto.js';
import { UpdateToolDto } from './dto/update-tool.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class ToolsMgmtService {
  constructor(private readonly repo: ToolRepository, private readonly idGen: IdGeneratorService) {}

  async create(dto: CreateToolDto): Promise<ToolDocument> {
    const customId = dto.customId || (await this.idGen.generateId(IdPrefix.TOOL));
    return this.repo.create({
      customId,
      name: dto.name,
      quantity: dto.quantity ?? 0,
      responsibleTechnicianName: dto.responsibleTechnicianName?.trim() ?? '',
      responsibleTechnician: dto.responsibleTechnician ? new Types.ObjectId(dto.responsibleTechnician) : undefined,
      location: dto.location?.trim() ?? '',
      notes: dto.notes?.trim() ?? '',
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<ToolDocument[]> { return this.repo.findAll(); }
  async findById(id: Types.ObjectId): Promise<ToolDocument> { const doc = await this.repo.findById(id); if (!doc) throw new NotFoundException('Tool not found'); return doc; }
  async search(query: string): Promise<ToolDocument[]> { return this.repo.search(query); }
  async update(id: Types.ObjectId, dto: UpdateToolDto): Promise<ToolDocument> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.responsibleTechnicianName !== undefined) data.responsibleTechnicianName = dto.responsibleTechnicianName?.trim() ?? '';
    if (dto.responsibleTechnician !== undefined) data.responsibleTechnician = dto.responsibleTechnician ? new Types.ObjectId(dto.responsibleTechnician) : null;
    if (dto.location !== undefined) data.location = dto.location?.trim() ?? '';
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() ?? '';
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Tool not found');
    return updated;
  }
  async delete(id: Types.ObjectId): Promise<void> { const deleted = await this.repo.deleteById(id); if (!deleted) throw new NotFoundException('Tool not found'); }
}
