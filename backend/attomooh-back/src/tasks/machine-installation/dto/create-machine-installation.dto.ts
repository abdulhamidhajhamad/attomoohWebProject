import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateMachineInstallationDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() time?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsString() @IsOptional() technicianReport?: string;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
