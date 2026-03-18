import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsOptional()
  customId?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  village: string;

  @IsString()
  @IsOptional()
  phonePrefix?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
