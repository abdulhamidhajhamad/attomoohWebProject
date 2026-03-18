import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateMachineDto {
  @IsString()
  @IsOptional()
  name?: string;

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
