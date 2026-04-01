import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ScheduleStatus } from '../../../common/enums/schedule-status.enum.js';

export type MaintenanceScheduleDocument = HydratedDocument<MaintenanceSchedule>;

@Schema({ timestamps: true, toJSON: { virtuals: true, transform(_doc, ret: Record<string, unknown>) { delete ret.__v; return ret; } } })
export class MaintenanceSchedule {
  @Prop({ type: Types.ObjectId, ref: 'MachineReception', required: true }) machineReception: Types.ObjectId;
  @Prop({ default: '' }) machineName: string;
  @Prop({ default: '' }) machineDetails: string;
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null }) technician: Types.ObjectId | null;
  @Prop({ default: '' }) technicianName: string;
  @Prop({ type: Date, required: true }) scheduledDate: Date;
  @Prop({ default: '' }) scheduledTime: string;
  @Prop({ enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED }) status: ScheduleStatus;
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null }) rescheduledTechnician: Types.ObjectId | null;
  @Prop({ default: '' }) rescheduledTechnicianName: string;
  @Prop({ type: Date, default: null }) rescheduledDate: Date | null;
  @Prop({ default: '' }) rescheduledTime: string;
  @Prop({ default: '' }) rescheduleReason: string;
  @Prop({ default: '' }) cancellationReason: string;
  createdAt: Date; updatedAt: Date;
}
export const MaintenanceScheduleSchema = SchemaFactory.createForClass(MaintenanceSchedule);
