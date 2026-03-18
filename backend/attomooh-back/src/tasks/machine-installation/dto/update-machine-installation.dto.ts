import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { InstallationStatus } from '../../../common/enums/installation-status.enum.js';

export class UpdateMachineInstallationDto {
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() time?: string;
  @IsMongoId() @IsOptional() technician?: string;
  @IsString() @IsOptional() technicianName?: string;
  @IsString() @IsOptional() technicianReport?: string;
  @IsEnum(InstallationStatus) @IsOptional() status?: InstallationStatus;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
