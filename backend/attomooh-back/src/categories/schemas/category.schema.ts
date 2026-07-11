import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Category {
  @Prop({
    type: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    required: true,
    _id: false,
  })
  name: { ar: string; en: string };

  @Prop({
    type: {
      ar: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' },
    },
    default: { ar: '', en: '' },
    _id: false,
  })
  description: { ar: string; en: string };

  @Prop({ trim: true, default: '' })
  icon: string;

  @Prop({ trim: true, default: '' })
  image: string;

  /** Self-referencing parents — empty array means root category */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  parents: Types.ObjectId[];

  /** Hierarchy depth: 0 = root, 1 = sub-category, 2 = sub-sub-category */
  @Prop({ type: Number, default: 0, min: 0, max: 2 })
  level: number;

  @Prop({ default: true })
  isActive: boolean;

  /**
   * Per-parent-child sort order for this parent's direct children.
   * Each entry maps a sub-category to its display order under THIS parent.
   * A sub-category can appear under multiple parents with different sortOrders.
   */
  @Prop({
    type: [
      {
        subCategoryId: { type: Types.ObjectId, ref: 'Category', required: true },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    default: [],
    _id: false,
  })
  childrenOrder: { subCategoryId: Types.ObjectId; sortOrder: number }[];

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

/* ── Indexes for hierarchy queries ── */
CategorySchema.index({ parents: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ 'name.ar': 1 }, { unique: true });
