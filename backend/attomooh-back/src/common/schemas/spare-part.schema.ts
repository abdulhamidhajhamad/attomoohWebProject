import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SparePart {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  cost: number;
}
