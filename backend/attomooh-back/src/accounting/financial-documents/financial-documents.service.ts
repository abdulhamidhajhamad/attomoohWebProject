import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FinancialDocumentRepository } from './repositories/financial-document.repository.js';
import { FinancialDocumentDocument } from './schemas/financial-document.schema.js';
import { CreateFinancialDocumentDto } from './dto/create-financial-document.dto.js';
import { UpdateFinancialDocumentDto } from './dto/update-financial-document.dto.js';
import { FinancialDocType } from '../../common/enums/financial-doc-type.enum.js';

@Injectable()
export class FinancialDocumentsService {
  private static readonly TYPE_PREFIXES: Record<FinancialDocType, string> = {
    [FinancialDocType.RECEIPT_VOUCHER]: 'RV',
    [FinancialDocType.PAYMENT_VOUCHER]: 'PV',
    [FinancialDocType.DISCOUNT]: 'DS',
    [FinancialDocType.SALES_INVOICE]: 'SI',
    [FinancialDocType.PURCHASE_INVOICE]: 'PI',
    [FinancialDocType.PRICE_QUOTE]: 'PQ',
    [FinancialDocType.TECHNICIAN_TRANSFER]: 'TT',
  };

  constructor(private readonly repo: FinancialDocumentRepository) {}

  async create(
    dto: CreateFinancialDocumentDto,
  ): Promise<FinancialDocumentDocument> {
    const count = await this.repo.countByType(dto.type);
    const prefix = FinancialDocumentsService.TYPE_PREFIXES[dto.type];
    const documentNumber = `${prefix}${String(count + 1).padStart(7, '0')}`;

    return this.repo.create({
      documentNumber,
      type: dto.type,
      date: dto.date ? new Date(dto.date) : new Date(),
      description: dto.description ?? '',
      amount: dto.amount ?? 0,
      customer: dto.customer ? new Types.ObjectId(dto.customer) : undefined,
      supplier: dto.supplier ? new Types.ObjectId(dto.supplier) : undefined,
      technician: dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined,
      machineReception: dto.machineReception
        ? new Types.ObjectId(dto.machineReception)
        : undefined,
      lineItems: (dto.lineItems ?? []) as any,
      subtotal: dto.subtotal ?? 0,
      discount: dto.discount ?? 0,
      total: dto.total ?? 0,
      notes: dto.notes ?? '',
      createdBy: new Types.ObjectId(dto.createdBy),
    });
  }

  async findAll(type?: FinancialDocType): Promise<FinancialDocumentDocument[]> {
    if (type) return this.repo.findByType(type);
    return this.repo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<FinancialDocumentDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Financial document not found');
    return doc;
  }

  async findByCustomer(
    customerId: Types.ObjectId,
  ): Promise<FinancialDocumentDocument[]> {
    return this.repo.findByCustomer(customerId);
  }

  async findBySupplier(
    supplierId: Types.ObjectId,
  ): Promise<FinancialDocumentDocument[]> {
    return this.repo.findBySupplier(supplierId);
  }

  async findByTechnician(
    technicianId: Types.ObjectId,
  ): Promise<FinancialDocumentDocument[]> {
    return this.repo.findByTechnician(technicianId);
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateFinancialDocumentDto,
  ): Promise<FinancialDocumentDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.customer !== undefined)
      data.customer = dto.customer
        ? new Types.ObjectId(dto.customer)
        : undefined;
    if (dto.supplier !== undefined)
      data.supplier = dto.supplier
        ? new Types.ObjectId(dto.supplier)
        : undefined;
    if (dto.technician !== undefined)
      data.technician = dto.technician
        ? new Types.ObjectId(dto.technician)
        : undefined;
    if (dto.machineReception !== undefined)
      data.machineReception = dto.machineReception
        ? new Types.ObjectId(dto.machineReception)
        : undefined;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Financial document not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Financial document not found');
  }
}
