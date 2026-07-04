import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString() @IsOptional() customId?: string;
  @IsString() @IsNotEmpty() brandAndModel: string;
  @IsString() @IsNotEmpty() plateNumber: string;
  @IsString() @IsOptional() responsiblePerson?: string;
  @IsMongoId() @IsOptional() responsibleUser?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
