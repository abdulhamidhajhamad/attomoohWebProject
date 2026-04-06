import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { InstallationStatus } from '../../../common/enums/installation-status.enum.js';

export class UpdateMachineInstallationDto {
  @IsMongoId() @IsOptional() machineReception?: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() pauseReason?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsString() @IsOptional() technicianReport?: string;
  @IsEnum(InstallationStatus) @IsOptional() status?: InstallationStatus;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
  @IsDateString() @IsOptional() scheduledStartTime?: string;
  @IsDateString() @IsOptional() scheduledEndTime?: string;
}
