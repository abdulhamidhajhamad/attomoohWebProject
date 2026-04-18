import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  image?: string;

  /** Change parent — empty array to make root, one ObjectId to assign parent */
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
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return value;
  })
  isActive?: boolean;
}
