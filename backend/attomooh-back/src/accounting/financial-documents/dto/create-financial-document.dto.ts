import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsNumber, Min, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { FinancialDocType } from '../../../common/enums/financial-doc-type.enum.js';

class LineItemDto {
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() unitPrice?: number;
  @IsNumber() @Min(0) @IsOptional() totalPrice?: number;
}

export class CreateFinancialDocumentDto {
  @IsEnum(FinancialDocType) type: FinancialDocType;
  @IsDateString() @IsOptional() date?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @IsOptional() amount?: number;
  @IsMongoId() @IsOptional() customer?: string;
  @IsMongoId() @IsOptional() supplier?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsMongoId() @IsOptional() machineReception?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) @IsOptional() lineItems?: LineItemDto[];
  @IsNumber() @Min(0) @IsOptional() subtotal?: number;
  @IsNumber() @Min(0) @IsOptional() discount?: number;
  @IsNumber() @Min(0) @IsOptional() total?: number;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsNotEmpty() createdBy: string;
}
