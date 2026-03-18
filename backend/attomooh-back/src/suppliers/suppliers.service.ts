import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SupplierRepository } from './repositories/supplier.repository.js';
import { SupplierDocument } from './schemas/supplier.schema.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly supplierRepo: SupplierRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateSupplierDto): Promise<SupplierDocument> {
    const customId = dto.customId || (await this.idGenerator.generateId(IdPrefix.SUPPLIER));
    return this.supplierRepo.create({
      customId,
      name: dto.name,
      phone: dto.phone ?? '',
      area: dto.area ? new Types.ObjectId(dto.area) : undefined,
      address: dto.address ?? '',
      notes: dto.notes ?? '',
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(): Promise<SupplierDocument[]> {
    return this.supplierRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<SupplierDocument> {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async search(query: string): Promise<SupplierDocument[]> {
    return this.supplierRepo.search(query);
  }

  async update(id: Types.ObjectId, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.area !== undefined) data.area = dto.area ? new Types.ObjectId(dto.area) : undefined;
    const updated = await this.supplierRepo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Supplier not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.supplierRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Supplier not found');
  }
}
