import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateTransportDto {
  @IsMongoId() @IsNotEmpty() machineReception: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() time?: string;
  @IsMongoId() @IsOptional() logistic?: string;
  @IsString() @IsOptional() logisticName?: string;
  @IsString() @IsOptional() logisticReport?: string;
  @IsBoolean() @IsOptional() readyForDelivery?: boolean;
  @IsNumber() @Min(0) @IsOptional() logisticFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
