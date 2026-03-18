import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateMaintenanceScheduleDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsDateString() @IsNotEmpty() scheduledDate: string;
  @IsString() @IsOptional() scheduledTime?: string;
}
