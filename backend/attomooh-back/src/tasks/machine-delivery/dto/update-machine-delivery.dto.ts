import { IsString, IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdateMachineDeliveryDto {
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsDateString() @IsOptional() deliveryDate?: string;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsOptional() deliveredBy?: string;
}
