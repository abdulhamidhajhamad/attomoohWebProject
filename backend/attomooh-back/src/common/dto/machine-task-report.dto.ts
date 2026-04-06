import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SparePartDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;
}

export class MachineTaskReportDto {
  @IsString()
  @IsOptional()
  pauseReason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SparePartDto)
  @IsOptional()
  spareParts?: SparePartDto[];

  @IsString()
  @IsOptional()
  technicianReport?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  technicianFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  companyFee?: number;
}

export class RejectionDto {
  @IsString()
  reason: string;
}

export class PauseReasonDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
