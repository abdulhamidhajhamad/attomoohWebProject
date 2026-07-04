import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ToolDocument = HydratedDocument<Tool>;

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
export class Tool {
  @Prop({ unique: true, required: true })
  customId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  responsibleTechnician: Types.ObjectId;

  @Prop({ default: '', trim: true })
  responsibleTechnicianName: string;

  @Prop({ default: '', trim: true })
  location: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ToolSchema = SchemaFactory.createForClass(Tool);
ToolSchema.index({ name: 'text' });
