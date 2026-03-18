import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskStatus } from '../../common/enums/task-status.enum.js';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';
import { ServiceOrder } from '../../service-orders/schemas/service-order.schema.js';

/* ═══════════════════════════════════
   Sub-documents
   ═══════════════════════════════════ */

/** A single time log entry (start / pause / resume / finish) */
export class TimeLog {
  @Prop({ required: true, enum: ['start', 'pause', 'resume', 'finish'] })
  action: 'start' | 'pause' | 'resume' | 'finish';

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;
}

/** A used part entry in the task report */
export class UsedPart {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: 0 })
  cost: number;
}

/** The task completion report */
export class TaskReport {
  @Prop({ default: '' })
  problemDescription: string;

  @Prop({ default: '' })
  solutionDescription: string;

  @Prop({ type: [UsedPart], default: [] })
  usedParts: UsedPart[];

  @Prop({ default: 0 })
  laborCost: number;

  @Prop({ default: '' })
  notes: string;
}

/* ═══════════════════════════════════
   Main Schema
   ═══════════════════════════════════ */

export type MaintenanceTaskDocument = HydratedDocument<MaintenanceTask>;

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
export class MaintenanceTask {
  /** Linked service order (optional — when set, title/machineInfo are derived from it) */
  @Prop({ type: Types.ObjectId, ref: ServiceOrder.name, default: null })
  serviceOrder: Types.ObjectId | null;

  /** Task title — auto-generated when linked to a service order */
  @Prop({ trim: true, default: '' })
  title: string;

  /** Task description / notes */
  @Prop({ default: '' })
  description: string;

  /** Machine / equipment info */
  @Prop({ default: '' })
  machineInfo: string;

  /** Location of the machine */
  @Prop({ default: '' })
  location: string;

  /** Task priority */
  @Prop({ required: true, enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  /** Current task status */
  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  /** Admin who created the task */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  /** Technician assigned to this task (optional until assigned) */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  /** Time tracking log entries */
  @Prop({ type: [TimeLog], default: [] })
  timeLogs: TimeLog[];

  /** Total active work duration in milliseconds (auto-calculated) */
  @Prop({ default: 0 })
  totalDurationMs: number;

  /** Completion report (filled by technician when finishing) */
  @Prop({ type: TaskReport, default: () => ({}) })
  report: TaskReport;

  /* ── Scheduling Fields (Calendar) ── */

  /** Scheduled date for the task */
  @Prop({ type: Date, default: null })
  scheduledDate: Date | null;

  /** Scheduled start time (HH:mm format, e.g. "09:00") */
  @Prop({ type: String, default: null })
  scheduledStartTime: string | null;

  /** Scheduled end time (HH:mm format, e.g. "11:30") */
  @Prop({ type: String, default: null })
  scheduledEndTime: string | null;

  /** Completion date — set when status becomes COMPLETED */
  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const MaintenanceTaskSchema =
  SchemaFactory.createForClass(MaintenanceTask);

// Index for common queries
MaintenanceTaskSchema.index({ status: 1 });
MaintenanceTaskSchema.index({ assignedTo: 1, status: 1 });
MaintenanceTaskSchema.index({ createdBy: 1 });
MaintenanceTaskSchema.index({ priority: 1 });
MaintenanceTaskSchema.index({ scheduledDate: 1, assignedTo: 1 });
MaintenanceTaskSchema.index({ serviceOrder: 1 });
