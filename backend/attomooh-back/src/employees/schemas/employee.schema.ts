import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EmployeeCategory } from '../../common/enums/employee-category.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../../common/enums/technician-status.enum.js';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class Employee {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  phone: string;

  @Prop({ default: '', trim: true })
  jobTitle: string;

  @Prop({ enum: EmployeeCategory, default: EmployeeCategory.PERMANENT })
  category: EmployeeCategory;

  @Prop({ type: Types.ObjectId, ref: 'Area', default: null })
  area: Types.ObjectId;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: true })
  isActive: boolean;

  /* ── Auth fields (optional — only for employees with system access) ── */

  @Prop({ type: String, sparse: true, unique: true, lowercase: true, trim: true, default: null })
  email: string | null;

  @Prop({ type: String, select: false, default: null })
  password: string | null;

  @Prop({ type: String, enum: UserRole, default: null })
  role: UserRole | null;

  @Prop({ enum: TechnicianStatus, default: TechnicianStatus.AVAILABLE })
  technicianStatus: TechnicianStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.index({ name: 'text', phone: 'text' });
