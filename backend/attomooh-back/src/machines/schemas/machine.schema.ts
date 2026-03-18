import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MachineDocument = HydratedDocument<Machine>;

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
export class Machine {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician2: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  technician3: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const MachineSchema = SchemaFactory.createForClass(Machine);
