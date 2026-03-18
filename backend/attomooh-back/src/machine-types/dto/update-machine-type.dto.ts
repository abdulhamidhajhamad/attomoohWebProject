import { IsString, IsOptional } from 'class-validator';

export class UpdateMachineTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
