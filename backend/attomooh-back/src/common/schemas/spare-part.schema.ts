import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SparePart {
  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ required: true })
  name: string;

  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ default: 1 })
  quantity: number;

  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ default: 0 })
  cost: number;
}
