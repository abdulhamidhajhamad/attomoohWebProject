import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class TimeLog {
  @Prop({ enum: ['start', 'pause', 'resume', 'finish'], required: true })
  action: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: '' })
  pauseReason: string;
}
