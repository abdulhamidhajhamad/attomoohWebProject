import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeLog } from '../../../common/schemas/time-log.schema.js';
import { SparePart } from '../../../common/schemas/spare-part.schema.js';

export type MachineProductionDocument =
  HydratedDocument<MachineProduction>;

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
export class MachineProduction {
  @Prop({ unique: true, required: true }) customId: string;
  @Prop({ required: true }) machineNameAndDetails: string;
  @Prop({ type: [TimeLog], default: [] }) timeLogs: TimeLog[];
  @Prop({ default: Date.now }) date: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician: Types.ObjectId;
  @Prop({ default: '' }) technicianName: string;
  @Prop({ default: 0 }) productionDurationMs: number;
  @Prop({ type: [SparePart], default: [] }) materialsAndParts: SparePart[];
  @Prop({ default: false }) readyForDelivery: boolean;
  @Prop({ default: 0 }) technicianFee: number;
  @Prop({ default: 0 }) companyFee: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineProductionSchema =
  SchemaFactory.createForClass(MachineProduction);
