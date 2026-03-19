import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } },
})
export class Vehicle {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  brandAndModel: string;

  @Prop({ required: true, trim: true })
  plateNumber: string;

  @Prop({ default: '', trim: true })
  responsiblePerson: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  responsibleUser: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
