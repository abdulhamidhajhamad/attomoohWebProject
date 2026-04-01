import { IsString, IsOptional, IsMongoId, IsDateString, IsEnum } from 'class-validator';
import { ScheduleStatus } from '../../../common/enums/schedule-status.enum.js';

export class UpdateMaintenanceScheduleDto {
  @IsMongoId() @IsOptional() machineReception?: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsDateString() @IsOptional() scheduledDate?: string;
  @IsString() @IsOptional() scheduledTime?: string;
  @IsEnum(ScheduleStatus) @IsOptional() status?: ScheduleStatus;
  @IsMongoId() @IsOptional() rescheduledTechnician?: string;
  @IsString() @IsOptional() rescheduledTechnicianName?: string;
  @IsDateString() @IsOptional() rescheduledDate?: string;
  @IsString() @IsOptional() rescheduledTime?: string;
  @IsString() @IsOptional() rescheduleReason?: string;
  @IsString() @IsOptional() cancellationReason?: string;
}
