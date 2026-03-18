import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateVehicleDto {
  @IsString() @IsOptional() brandAndModel?: string;
  @IsString() @IsOptional() plateNumber?: string;
  @IsString() @IsOptional() responsiblePerson?: string;
  @IsMongoId() @IsOptional() responsibleUser?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
