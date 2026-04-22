import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateMachineDeliveryDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsDateString() @IsOptional() deliveryDate?: string;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsOptional() deliveredBy?: string;
  @IsString() @IsOptional() technicianReport?: string;
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
