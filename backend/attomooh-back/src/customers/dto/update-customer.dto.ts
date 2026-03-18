import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsMongoId()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsOptional()
  technician1?: string;

  @IsMongoId()
  @IsOptional()
  technician2?: string;

  @IsMongoId()
  @IsOptional()
  technician3?: string;
}
