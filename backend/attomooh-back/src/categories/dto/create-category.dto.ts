import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
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

  /** Parent category ID — omit or send empty for root categories */
  @IsArray()
  @ArrayMaxSize(1, { message: 'Only one parent category is allowed' })
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    return [];
  })
  parentIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}