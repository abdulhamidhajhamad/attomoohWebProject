import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ServiceOrderStatus } from '../../common/enums/service-order-status.enum.js';
import { MachineCondition } from '../../common/enums/machine-condition.enum.js';

/* ═══════════════════════════════════
   Sub-documents
   ═══════════════════════════════════ */

/** A single time log entry */
export class TimeLog {
  @Prop({ required: true, enum: ['start', 'pause', 'resume', 'finish'] })
  action: 'start' | 'pause' | 'resume' | 'finish';

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;
}

/** قطعة غيار */
export class SparePart {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: 0 })
  cost: number;
}

/** تقرير إنهاء الصيانة */
export class CompletionReport {
  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: String, default: '' })
  technicianReport: string;

  /** مدة الصيانة بالملي ثانية — يُحسب تلقائياً من timeLogs */
  @Prop({ default: 0 })
  durationMs: number;

  @Prop({ type: [SparePart], default: [] })
  spareParts: SparePart[];

  /** أجرة الصيانة (عمل يدوي) */
  @Prop({ default: 0 })
  maintenanceFee: number;

  /** التكلفة الإجمالية (قطع + أجرة) */
  @Prop({ default: 0 })
  totalCost: number;

  /** ملاحظات إضافية من الفني */
  @Prop({ type: String, default: '' })
  notes: string;
}

/* ═══════════════════════════════════
   Main Schema
   ═══════════════════════════════════ */

export type ServiceOrderDocument = HydratedDocument<ServiceOrder>;

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
export class ServiceOrder {
  /** رقم النموذج — تلقائي (auto-increment) */
  @Prop({ required: true, unique: true })
  formNumber: number;

  /* ── معلومات الآلة ── */

  /** نوع الآلة (ref) */
  @Prop({ type: Types.ObjectId, ref: 'MachineType', default: null })
  machineType: Types.ObjectId | null;

  /** تفاصيل الآلة — إدخال يدوي */
  @Prop({ default: '' })
  machineDetails: string;

  /** رقم الآلة المتسلسل */
  @Prop({ default: '' })
  serialNumber: string;

  /* ── معلومات الزبون ── */

  /** زبون محفوظ (ref — اختياري) */
  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  customer: Types.ObjectId | null;

  /** اسم الزبون — إدخال يدوي أو من القائمة */
  @Prop({ required: true, trim: true })
  customerName: string;

  /** جوال الزبون */
  @Prop({ default: '' })
  customerPhone: string;

  /** عنوان الزبون */
  @Prop({ default: '' })
  customerAddress: string;

  /** ملاحظات الزبون */
  @Prop({ default: '' })
  customerNotes: string;

  /* ── بيانات الاستلام ── */

  /** الكفالة — نعم / لا */
  @Prop({ default: false })
  warranty: boolean;

  /** تاريخ الاستلام — تلقائي */
  @Prop({ type: Date, default: () => new Date() })
  receptionDate: Date;

  /** تاريخ التسليم المتوقع */
  @Prop({ type: Date, default: null })
  expectedDeliveryDate: Date | null;

  /** حالة الآلة عند الاستلام */
  @Prop({ enum: MachineCondition, default: MachineCondition.COMPLETE })
  condition: MachineCondition;

  /** وصف الزبون للمشكلة */
  @Prop({ default: '' })
  customerProblemDesc: string;

  /* ── حالة أمر الخدمة ── */

  @Prop({ required: true, enum: ServiceOrderStatus, default: ServiceOrderStatus.WAITING })
  status: ServiceOrderStatus;

  /** الفني المعيّن */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  assignedTo: Types.ObjectId | null;

  /** الأدمن الذي أنشأ الأمر */
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  createdBy: Types.ObjectId;

  /* ── تتبع الوقت ── */

  @Prop({ type: [TimeLog], default: [] })
  timeLogs: TimeLog[];

  @Prop({ default: 0 })
  totalDurationMs: number;

  /* ── تقرير الإنهاء ── */

  @Prop({ type: CompletionReport, default: () => ({}) })
  completionReport: CompletionReport;

  /* ── التسليم ── */

  /** تاريخ التسليم الفعلي */
  @Prop({ type: Date, default: null })
  deliveryDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceOrderSchema = SchemaFactory.createForClass(ServiceOrder);

// Indexes
ServiceOrderSchema.index({ status: 1 });
ServiceOrderSchema.index({ assignedTo: 1, status: 1 });
ServiceOrderSchema.index({ customer: 1 });
ServiceOrderSchema.index({ machineType: 1 });
ServiceOrderSchema.index({ receptionDate: -1 });
