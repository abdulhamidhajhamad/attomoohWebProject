import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateMachineDeliveryDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsDateString() @IsOptional() deliveryDate?: string;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsOptional() deliveredBy?: string;
}
