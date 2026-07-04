import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MaterialType } from '../../../common/enums/material-type.enum.js';
import { OrderLineItem } from '../../../common/schemas/order-line-item.schema.js';

export type PurchaseOrderDocument = HydratedDocument<PurchaseOrder>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class PurchaseOrder {
  @Prop({ unique: true, required: true }) customId: string;
  @Prop({ default: Date.now }) date: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  requestedBy: Types.ObjectId;
  @Prop({ default: '' }) requestedByName: string;
  @Prop({ enum: MaterialType, default: MaterialType.SPARE_PARTS })
  materialType: MaterialType;
  @Prop({ type: Types.ObjectId, ref: 'Machine', default: null })
  machine: Types.ObjectId;
  @Prop({ default: '' }) machineDetails: string;
  @Prop({ type: [OrderLineItem], default: [] }) items: OrderLineItem[];
  @Prop({ type: Types.ObjectId, ref: 'Supplier', default: null })
  supplier: Types.ObjectId;
  @Prop({ default: '' }) supplierName: string;
  @Prop({ default: false }) approved: boolean;
  @Prop({ default: '' }) notes: string;
  createdAt: Date;
  updatedAt: Date;
}
export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
