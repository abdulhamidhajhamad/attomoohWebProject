import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @IsOptional()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsOptional()
  technician1?: string;

  @IsMongoId()
  @IsOptional()
  technician2?: string;

  @IsMongoId()
  @IsOptional()
  technician3?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
