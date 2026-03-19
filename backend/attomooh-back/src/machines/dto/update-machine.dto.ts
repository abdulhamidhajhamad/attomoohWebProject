import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateMachineDto {
  @IsString()
  @IsOptional()
  name?: string;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
