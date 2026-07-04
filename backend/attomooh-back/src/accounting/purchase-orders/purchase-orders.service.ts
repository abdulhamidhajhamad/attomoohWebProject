import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository.js';
import { PurchaseOrderDocument } from './schemas/purchase-order.schema.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto.js';
import { IdGeneratorService } from '../../common/services/id-generator.service.js';
import { IdPrefix } from '../../common/enums/id-prefix.enum.js';
import { MaterialType } from '../../common/enums/material-type.enum.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repo: PurchaseOrderRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderDocument> {
    const customId =
      dto.customId ||
      (await this.idGenerator.generateId(IdPrefix.PURCHASE_ORDER));

    return this.repo.create({
      customId,
      date: dto.date ? new Date(dto.date) : new Date(),
      requestedBy: dto.requestedBy
        ? new Types.ObjectId(dto.requestedBy)
        : undefined,
      requestedByName: dto.requestedByName ?? '',
      materialType: dto.materialType ?? MaterialType.SPARE_PARTS,
      machine: dto.machine ? new Types.ObjectId(dto.machine) : undefined,
      machineDetails: dto.machineDetails ?? '',
      items: (dto.items ?? []) as any,
      supplier: dto.supplier ? new Types.ObjectId(dto.supplier) : undefined,
      supplierName: dto.supplierName ?? '',
      approved: dto.approved ?? false,
      notes: dto.notes ?? '',
    });
  }

  async findAll(): Promise<PurchaseOrderDocument[]> {
    return this.repo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<PurchaseOrderDocument> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.requestedBy !== undefined)
      data.requestedBy = dto.requestedBy
        ? new Types.ObjectId(dto.requestedBy)
        : undefined;
    if (dto.machine !== undefined)
      data.machine = dto.machine ? new Types.ObjectId(dto.machine) : undefined;
    if (dto.supplier !== undefined)
      data.supplier = dto.supplier
        ? new Types.ObjectId(dto.supplier)
        : undefined;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Purchase order not found');
    return updated;
  }

  async approve(id: Types.ObjectId): Promise<PurchaseOrderDocument> {
    const updated = await this.repo.updateById(id, { approved: true } as any);
    if (!updated) throw new NotFoundException('Purchase order not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Purchase order not found');
  }
}
