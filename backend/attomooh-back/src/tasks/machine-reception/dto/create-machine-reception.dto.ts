import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsMongoId, IsDateString, IsEnum } from 'class-validator';

export class CreateMachineReceptionDto {
  @IsString() @IsOptional() customId?: string;
  @IsMongoId() @IsOptional() machine?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsString() @IsOptional() serialNumber?: string;
  @IsMongoId() @IsOptional() customer?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsString() @IsOptional() customerPhone?: string;
  @IsString() @IsOptional() customerAddress?: string;
  @IsBoolean() @IsOptional() warranty?: boolean;
  @IsDateString() @IsOptional() expectedDeliveryDate?: string;
  @IsEnum(['complete', 'incomplete']) @IsOptional() condition?: string;
  @IsString() @IsOptional() receivedParts?: string;
  @IsString() @IsOptional() customerProblemDesc?: string;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsOptional() receivedBy?: string;
}
