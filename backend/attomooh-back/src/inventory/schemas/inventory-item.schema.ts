import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryItemDocument = HydratedDocument<InventoryItem>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } },
})
export class InventoryItem {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 0 })
  purchasePrice: number;

  @Prop({ default: 0 })
  sellingPrice: number;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ default: '', trim: true })
  location: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
InventoryItemSchema.index({ name: 'text' });
