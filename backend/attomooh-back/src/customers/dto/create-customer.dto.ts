import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsOptional()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

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

  @IsString()
  @IsOptional()
  technician1Name?: string;

  @IsMongoId()
  @IsOptional()
  technician2?: string;

  @IsString()
  @IsOptional()
  technician2Name?: string;

  @IsMongoId()
  @IsOptional()
  technician3?: string;

  @IsString()
  @IsOptional()
  technician3Name?: string;
}
