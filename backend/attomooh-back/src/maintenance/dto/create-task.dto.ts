import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsDateString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';

export class CreateTaskDto {
  /** Linked service order — if provided, title is auto-generated */
  @IsMongoId()
  @IsOptional()
  serviceOrder?: string;

  /**
   * Title is required ONLY when serviceOrder is not provided.
   * When serviceOrder is set, title is auto-generated from order info.
   */
  @ValidateIf((o) => !o.serviceOrder)
  @IsString()
  @IsNotEmpty()
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

  /** Optionally assign a technician immediately */
  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  /* ── Scheduling (Calendar) ── */

  /** Scheduled date — ISO date string (e.g. "2026-03-10") */
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  /** Scheduled start time — HH:mm (e.g. "09:00") */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'scheduledStartTime must be HH:mm format' })
  @IsOptional()
  scheduledStartTime?: string;

  /** Scheduled end time — HH:mm (e.g. "11:30") */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'scheduledEndTime must be HH:mm format' })
  @IsOptional()
  scheduledEndTime?: string;
}
