import { IsString, IsOptional, IsMongoId, IsBoolean, IsNumber, Min, IsArray, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionStatus } from '../../../common/enums/inspection-status.enum.js';

class SparePartDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() cost?: number;
}

export class UpdateMachineInspectionDto {
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() time?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SparePartDto) @IsOptional() spareParts?: SparePartDto[];
  @IsString() @IsOptional() technicianReport?: string;
  @IsBoolean() @IsOptional() readyForDelivery?: boolean;
  @IsEnum(InspectionStatus) @IsOptional() status?: InspectionStatus;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
