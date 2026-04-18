import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// ── Embedded Schema: Product Image ──
@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  publicId: string;

  @Prop({ required: true })
  secureUrl: string;

  @Prop({ default: false })
  isCover: boolean;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// ── Main Schema: Product ──
export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Product {
  @Prop({ type: { ar: { type: String, required: true, trim: true }, en: { type: String, required: true, trim: true } }, required: true, _id: false })
  name: { ar: string; en: string };

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ required: false, min: 0 })
  price: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], required: true })
  categories: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  specifications: Record<string, unknown>;

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
