import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsBoolean, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SparePartDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() cost?: number;
}

export class CreateMachineInspectionDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() time?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SparePartDto) @IsOptional() spareParts?: SparePartDto[];
  @IsString() @IsOptional() technicianReport?: string;
  @IsBoolean() @IsOptional() readyForDelivery?: boolean;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
