import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMachineTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
