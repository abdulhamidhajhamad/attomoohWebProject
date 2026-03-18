import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MachineTypeDocument = HydratedDocument<MachineType>;

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
export class MachineType {
  /** اسم نوع الآلة (مثل: آلة فرم لحمة) */
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  /** وصف اختياري */
  @Prop({ default: '' })
  description: string;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineTypeSchema = SchemaFactory.createForClass(MachineType);
