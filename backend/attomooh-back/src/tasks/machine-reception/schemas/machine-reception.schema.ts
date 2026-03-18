import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeLog } from '../../../common/schemas/time-log.schema.js';
import { SparePart } from '../../../common/schemas/spare-part.schema.js';
import { ReceptionStatus } from '../../../common/enums/reception-status.enum.js';

export type MachineReceptionDocument = HydratedDocument<MachineReception>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } },
})
export class MachineReception {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ type: Types.ObjectId, ref: 'Machine', default: null })
  machine: Types.ObjectId;

  @Prop({ default: '' })
  machineDetails: string;

  @Prop({ default: '' })
  serialNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  customer: Types.ObjectId;

  @Prop({ default: '' })
  customerName: string;

  @Prop({ default: '' })
  customerPhone: string;

  @Prop({ default: '' })
  customerAddress: string;

  @Prop({ default: false })
  warranty: boolean;

  @Prop({ default: Date.now })
  receptionDate: Date;

  @Prop({ type: Date, default: null })
  expectedDeliveryDate: Date;

  @Prop({ enum: ['complete', 'incomplete'], default: 'complete' })
  condition: string;

  @Prop({ default: '' })
  receivedParts: string;

  @Prop({ default: '' })
  customerProblemDesc: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  receivedBy: Types.ObjectId;

  @Prop({ enum: ReceptionStatus, default: ReceptionStatus.WAITING })
  status: ReceptionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId;

  @Prop({ type: [TimeLog], default: [] })
  timeLogs: TimeLog[];

  @Prop({ default: 0 })
  totalDurationMs: number;

  @Prop({ type: [SparePart], default: [] })
  spareParts: SparePart[];

  @Prop({ default: '' })
  technicianReport: string;

  @Prop({ default: 0 })
  technicianFee: number;

  @Prop({ default: 0 })
  companyFee: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineReceptionSchema = SchemaFactory.createForClass(MachineReception);
