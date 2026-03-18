import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerCallDocument = HydratedDocument<CustomerCall>;

@Schema({ timestamps: true, toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } } })
export class CustomerCall {
  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null }) customer: Types.ObjectId;
  @Prop({ default: '' }) customerName: string;
  @Prop({ default: '' }) customerPhone: string;
  @Prop({ default: '' }) customerAddress: string;
  @Prop({ type: Types.ObjectId, ref: 'Machine', default: null }) machine: Types.ObjectId;
  @Prop({ default: '' }) machineDetails: string;
  @Prop({ default: false }) warranty: boolean;
  @Prop({ default: Date.now }) date: Date;
  @Prop({ default: '' }) time: string;
  @Prop({ default: '' }) customerProblemDesc: string;
  @Prop({ default: '' }) solution: string;
  @Prop({ default: '' }) notes: string;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) receivedBy: Types.ObjectId;
  createdAt: Date; updatedAt: Date;
}
export const CustomerCallSchema = SchemaFactory.createForClass(CustomerCall);
