import { IsString, IsOptional, IsBoolean, IsMongoId, IsDateString, IsEnum, IsNumber, IsArray, ValidateNested, Min, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ReceptionStatus } from '../../../common/enums/reception-status.enum.js';

class SparePartDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @IsNumber() @Min(0) @IsOptional() cost?: number;
}

export class UpdateMachineReceptionDto {
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
  @Transform(({ value }) => value === null ? undefined : value)
  @IsMongoId() @IsOptional() receivedBy?: string | null;
  @IsString() @IsOptional() receivedByName?: string;
  @IsMongoId() @IsOptional() assignedTo?: string;
  @IsEnum(ReceptionStatus) @IsOptional() status?: ReceptionStatus;
  @IsString() @IsOptional() technicianReport?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SparePartDto) @IsOptional() spareParts?: SparePartDto[];
  @IsNumber() @Min(0) @IsOptional() technicianFee?: number;
  @IsNumber() @Min(0) @IsOptional() companyFee?: number;
}
