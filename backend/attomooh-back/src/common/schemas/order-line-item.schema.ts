import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderLineItem {
  @Prop({ required: true })
  description: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  unitPrice: number;

  @Prop({ default: 0 })
  totalPrice: number;
}
