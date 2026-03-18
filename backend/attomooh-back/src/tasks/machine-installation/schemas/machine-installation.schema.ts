import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeLog } from '../../../common/schemas/time-log.schema.js';
import { InstallationStatus } from '../../../common/enums/installation-status.enum.js';

export type MachineInstallationDocument =
  HydratedDocument<MachineInstallation>;

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
export class MachineInstallation {
  @Prop({ type: Types.ObjectId, ref: 'MachineReception', required: true })
  machineReception: Types.ObjectId;

  @Prop({ default: '' }) machineName: string;
  @Prop({ default: '' }) machineDetails: string;
  @Prop({ type: [TimeLog], default: [] }) timeLogs: TimeLog[];
  @Prop({ default: Date.now }) date: Date;
  @Prop({ default: '' }) time: string;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician: Types.ObjectId;
  @Prop({ default: '' }) technicianName: string;
  @Prop({ default: '' }) technicianReport: string;
  @Prop({ default: 0 }) installationDurationMs: number;
  @Prop({ enum: InstallationStatus, default: InstallationStatus.POSTPONED })
  status: InstallationStatus;
  @Prop({ default: 0 }) technicianFee: number;
  @Prop({ default: 0 }) companyFee: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineInstallationSchema =
  SchemaFactory.createForClass(MachineInstallation);
