import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

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
export class Supplier {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Area', default: null })
  area: Types.ObjectId;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
SupplierSchema.index({ name: 'text', phone: 'text' });
