import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../../common/enums/technician-status.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: true, trim: true })
  phone: string;

  /** Technician-only: current work status (ignored for non-technicians) */
  @Prop({ enum: TechnicianStatus, default: TechnicianStatus.AVAILABLE })
  technicianStatus: TechnicianStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
