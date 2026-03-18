import { IsOptional, IsString, IsMongoId, IsBoolean, IsArray } from 'class-validator';
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

  /** Change parents — empty array to make root, array of ObjectIds to assign parents */
  @IsArray()
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
