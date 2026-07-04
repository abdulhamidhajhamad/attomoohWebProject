import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

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
