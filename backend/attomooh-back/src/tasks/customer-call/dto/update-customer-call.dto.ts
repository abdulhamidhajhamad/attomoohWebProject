import { IsString, IsOptional, IsMongoId, IsBoolean } from 'class-validator';

export class UpdateCustomerCallDto {
  @IsMongoId() @IsOptional() customer?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsString() @IsOptional() customerPhone?: string;
  @IsString() @IsOptional() customerAddress?: string;
  @IsMongoId() @IsOptional() machine?: string;
  @IsString() @IsOptional() machineName?: string;
  @IsString() @IsOptional() machineDetails?: string;
  @IsBoolean() @IsOptional() warranty?: boolean;
  @IsString() @IsOptional() customerProblemDesc?: string;
  @IsString() @IsOptional() solution?: string;
  @IsString() @IsOptional() notes?: string;
  @IsMongoId() @IsOptional() receivedBy?: string;
  @IsString() @IsOptional() receivedByName?: string;
}
