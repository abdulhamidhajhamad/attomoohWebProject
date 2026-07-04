import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeLog } from '../../../common/schemas/time-log.schema.js';

export type TransportDocument = HydratedDocument<Transport>;

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
export class Transport {
  @Prop({ type: Types.ObjectId, ref: 'MachineReception', required: true })
  machineReception: Types.ObjectId;
  @Prop({ default: '' }) machineName: string;
  @Prop({ default: '' }) machineDetails: string;
  @Prop({ type: [TimeLog], default: [] }) timeLogs: TimeLog[];
  @Prop({ default: Date.now }) date: Date;
  @Prop({ default: () => new Date().toTimeString().slice(0, 5) }) time: string;
  @Prop({ default: '' }) pauseReason: string;
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  logistic: Types.ObjectId;
  @Prop({ default: '' }) logisticName: string;
  @Prop({ default: '' }) logisticReport: string;
  @Prop({ default: 0 }) transportDurationMs: number;
  @Prop({ default: false }) readyForDelivery: boolean;
  @Prop({ default: 0 }) logisticFee: number;
  @Prop({ default: 0 }) companyFee: number;
  createdAt: Date;
  updatedAt: Date;
}
export const TransportSchema = SchemaFactory.createForClass(Transport);
