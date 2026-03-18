import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class UsedPartDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;
}

export class TaskReportDto {
  @IsString()
  @IsOptional()
  problemDescription?: string;

  @IsString()
  @IsOptional()
  solutionDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsedPartDto)
  @IsOptional()
  usedParts?: UsedPartDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  laborCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
