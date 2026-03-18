import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MachineDeliveryDocument = HydratedDocument<MachineDelivery>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } },
})
export class MachineDelivery {
  @Prop({ type: Types.ObjectId, ref: 'MachineReception', required: true })
  machineReception: Types.ObjectId;

  @Prop({ default: '' })
  machineName: string;

  @Prop({ default: '' })
  machineDetails: string;

  @Prop({ default: '' })
  customerName: string;

  @Prop({ type: Date, default: Date.now })
  deliveryDate: Date;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deliveredBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineDeliverySchema = SchemaFactory.createForClass(MachineDelivery);
