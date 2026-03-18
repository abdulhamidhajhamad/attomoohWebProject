import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

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
export class Customer {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Area', default: null })
  area: Types.ObjectId;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician2: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician3: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ name: 'text', phone: 'text' });
