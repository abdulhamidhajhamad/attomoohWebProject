import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Counter collection — auto-increment IDs.
 * Each document holds a counter for a specific sequence (e.g. "serviceOrder").
 */
@Schema()
export class Counter {
  /** Sequence name (e.g. "machine", "customer", "serviceOrder") */
  @Prop({ required: true, unique: true })
  name: string;

  /** Current value */
  @Prop({ required: true, default: 0 })
  value: number;

  /** ID prefix character (e.g. 'M', 'C', 'S') */
  @Prop({ default: '' })
  prefix: string;

  /** Zero-padding length for the numeric part */
  @Prop({ default: 7 })
  padLength: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
