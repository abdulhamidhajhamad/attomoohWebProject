import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class TimeLog {
  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ enum: ['start', 'pause', 'resume', 'finish'], required: true })
  action: string;

  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ default: Date.now })
  timestamp: Date;

  // @ts-ignore -- decorator signature mismatch with TS 5 decorator context
  @Prop({ default: '' })
  pauseReason: string;
}
