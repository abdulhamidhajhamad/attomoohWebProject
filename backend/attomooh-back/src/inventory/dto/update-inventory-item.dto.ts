import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateInventoryItemDto {
  @IsString() @IsOptional() name?: string;
  @IsNumber() @Min(0) @IsOptional() purchasePrice?: number;
  @IsNumber() @Min(0) @IsOptional() sellingPrice?: number;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
