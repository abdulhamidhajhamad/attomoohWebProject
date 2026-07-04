import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string')
      return value
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean);
    return [value];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  specifications?: Record<string, unknown>;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  existingImages?: string[];
}
