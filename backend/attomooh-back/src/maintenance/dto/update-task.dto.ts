import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsDateString,
  Matches,
} from 'class-validator';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  machineInfo?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  /* ── Scheduling (Calendar) ── */

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduledStartTime must be HH:mm format',
  })
  @IsOptional()
  scheduledStartTime?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduledEndTime must be HH:mm format',
  })
  @IsOptional()
  scheduledEndTime?: string;
}
