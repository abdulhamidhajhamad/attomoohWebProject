import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FinancialDocType } from '../../../common/enums/financial-doc-type.enum.js';
import { OrderLineItem } from '../../../common/schemas/order-line-item.schema.js';

export type FinancialDocumentDocument = HydratedDocument<FinancialDocument>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } },
})
export class FinancialDocument {
  @Prop({ unique: true, required: true })
  documentNumber: string;

  @Prop({ enum: FinancialDocType, required: true })
  type: FinancialDocType;

  @Prop({ default: Date.now })
  date: Date;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', default: null })
  supplier: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MachineReception', default: null })
  machineReception: Types.ObjectId;

  @Prop({ type: [OrderLineItem], default: [] })
  lineItems: OrderLineItem[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const FinancialDocumentSchema = SchemaFactory.createForClass(FinancialDocument);
FinancialDocumentSchema.index({ type: 1, date: -1 });
FinancialDocumentSchema.index({ customer: 1 });
FinancialDocumentSchema.index({ supplier: 1 });
