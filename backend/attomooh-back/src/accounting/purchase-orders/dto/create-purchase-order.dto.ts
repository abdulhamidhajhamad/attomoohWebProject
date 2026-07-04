import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialType } from '../../../common/enums/material-type.enum.js';

class LineItemDto {
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() unitPrice?: number;
  @IsNumber() @Min(0) @IsOptional() totalPrice?: number;
}

export class CreatePurchaseOrderDto {
  @IsString() @IsOptional() customId?: string;
  @IsDateString() @IsOptional() date?: string;
  @IsMongoId() @IsOptional() requestedBy?: string;
  @IsString() @IsOptional() requestedByName?: string;
  @IsEnum(MaterialType) @IsOptional() materialType?: MaterialType;
  @IsMongoId() @IsOptional() machine?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsOptional()
  items?: LineItemDto[];
  @IsMongoId() @IsOptional() supplier?: string;
  @IsString() @IsOptional() supplierName?: string;
  @IsBoolean() @IsOptional() approved?: boolean;
  @IsString() @IsOptional() notes?: string;
}
