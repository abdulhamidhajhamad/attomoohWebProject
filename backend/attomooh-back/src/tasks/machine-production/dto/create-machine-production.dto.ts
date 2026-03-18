import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MaterialPartDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() cost?: number;
}

export class CreateMachineProductionDto {
  @IsString() @IsNotEmpty() machineNameAndDetails: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MaterialPartDto) @IsOptional() materialsAndParts?: MaterialPartDto[];
  @IsBoolean() @IsOptional() readyForDelivery?: boolean;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
