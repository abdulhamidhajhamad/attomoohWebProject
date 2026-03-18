import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  /**
   * Accepts a single category ID string or a comma-separated list.
   * Transformer normalises it into a string array for the service.
   */
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v: string) => v.trim()).filter(Boolean);
    return [value];
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  categories: string[];

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
}
