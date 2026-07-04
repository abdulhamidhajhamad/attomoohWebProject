import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateToolDto {
  @IsString() @IsOptional() customId?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsMongoId() @IsOptional() responsibleTechnician?: string;
  @IsString() @IsOptional() responsibleTechnicianName?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
