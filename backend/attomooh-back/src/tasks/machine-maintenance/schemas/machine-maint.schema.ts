import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeLog } from '../../../common/schemas/time-log.schema.js';
import { SparePart } from '../../../common/schemas/spare-part.schema.js';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';

export type MachineMaintDocument = HydratedDocument<MachineMaint>;

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
export class MachineMaint {
  @Prop({ type: Types.ObjectId, ref: 'MachineReception', required: true })
  machineReception!: Types.ObjectId;

  @Prop({ default: '' }) machineName!: string;
  @Prop({ default: '' }) machineDetails!: string;
  @Prop({ type: [TimeLog], default: [] }) timeLogs!: TimeLog[];
  @Prop({ default: Date.now }) date!: Date;
  @Prop({ default: () => new Date().toTimeString().slice(0, 5) }) time!: string;
  @Prop({ default: '' }) pauseReason!: string;
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  technician!: Types.ObjectId | null;
  @Prop({ default: '' }) technicianName!: string;
  @Prop({ type: [SparePart], default: [] }) spareParts!: SparePart[];
  @Prop({ default: '' }) technicianReport!: string;
  @Prop({ default: false }) readyForDelivery!: boolean;
  @Prop({ default: 0 }) maintenanceDurationMs!: number;
  @Prop({ enum: MaintenanceStatus, default: MaintenanceStatus.WAITING })
  status!: MaintenanceStatus;
  @Prop({ default: 0 }) technicianFee!: number;
  @Prop({ default: 0 }) companyFee!: number;
  @Prop({ type: Date, default: null }) scheduledStartTime!: Date | null;
  @Prop({ type: Date, default: null }) scheduledEndTime!: Date | null;
  @Prop({ default: '' }) rejectionReason!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MachineMaintSchema = SchemaFactory.createForClass(MachineMaint);
