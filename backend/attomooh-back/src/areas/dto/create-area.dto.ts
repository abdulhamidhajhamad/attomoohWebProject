import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsOptional()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phonePrefix?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
