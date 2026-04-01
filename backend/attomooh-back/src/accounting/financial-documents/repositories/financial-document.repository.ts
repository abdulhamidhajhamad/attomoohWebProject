import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FinancialDocument, FinancialDocumentDocument } from '../schemas/financial-document.schema.js';
import { FinancialDocType } from '../../../common/enums/financial-doc-type.enum.js';

@Injectable()
export class FinancialDocumentRepository {
  constructor(@InjectModel(FinancialDocument.name) private readonly model: Model<FinancialDocumentDocument>) {}

  async create(data: Partial<FinancialDocument>): Promise<FinancialDocumentDocument> { return new this.model(data).save(); }

  async findById(id: Types.ObjectId): Promise<FinancialDocumentDocument | null> {
    return this.model.findById(id)
      .populate('customer').populate('supplier').populate('technician', 'name phone')
      .populate('machineReception').populate('createdBy', 'name').exec();
  }

  async findAll(filter: Record<string, unknown> = {}): Promise<FinancialDocumentDocument[]> {
    return this.model.find(filter).sort({ createdAt: -1 })
      .populate('customer').populate('supplier').populate('technician', 'name phone')
      .populate('machineReception').populate('createdBy', 'name').exec();
  }

  async findByType(type: FinancialDocType): Promise<FinancialDocumentDocument[]> { return this.findAll({ type }); }
  async findByCustomer(customerId: Types.ObjectId): Promise<FinancialDocumentDocument[]> { return this.findAll({ customer: customerId }); }
  async findBySupplier(supplierId: Types.ObjectId): Promise<FinancialDocumentDocument[]> { return this.findAll({ supplier: supplierId }); }
  async findByTechnician(technicianId: Types.ObjectId): Promise<FinancialDocumentDocument[]> { return this.findAll({ technician: technicianId }); }

  async updateById(id: Types.ObjectId, data: Partial<FinancialDocument>): Promise<FinancialDocumentDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  async deleteById(id: Types.ObjectId): Promise<FinancialDocumentDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async countByType(type: FinancialDocType): Promise<number> {
    return this.model.countDocuments({ type }).exec();
  }
}
