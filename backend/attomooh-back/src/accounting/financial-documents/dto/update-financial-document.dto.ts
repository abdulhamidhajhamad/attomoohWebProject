import { IsString, IsOptional, IsMongoId, IsNumber, Min, IsArray, ValidateNested, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LineItemDto {
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() unitPrice?: number;
  @IsNumber() @Min(0) @IsOptional() totalPrice?: number;
}

export class UpdateFinancialDocumentDto {
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
}
