import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';

class SparePartDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() cost?: number;
}

export class CreateMachineMaintDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() pauseReason?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SparePartDto) @IsOptional() spareParts?: SparePartDto[];
  @IsString() @IsOptional() technicianReport?: string;
  @IsEnum(MaintenanceStatus) @IsOptional() status?: MaintenanceStatus;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
  @IsDateString() @IsOptional() scheduledStartTime?: string;
  @IsDateString() @IsOptional() scheduledEndTime?: string;
}
