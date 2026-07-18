import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  image?: string;

  /** Parent category IDs — omit or send empty for root categories */
  @IsArray()
  @ArrayMaxSize(5, {
    message: 'A category can be linked to up to 5 parent categories',
  })
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string')
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    return [];
  })
  parentIds?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return value;
  })
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10) || 0;
    return value;
  })
  sortOrder?: number;
}
