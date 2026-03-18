import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class SparePartDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  cost?: number;
}

export class CompleteServiceOrderDto {
  @IsString()
  @IsOptional()
  technicianReport?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SparePartDto)
  @IsOptional()
  spareParts?: SparePartDto[];

  @IsNumber()
  @IsOptional()
  maintenanceFee?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
