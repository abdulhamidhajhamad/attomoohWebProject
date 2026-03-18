import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { MachineCondition } from '../../common/enums/machine-condition.enum.js';
import { ServiceOrderStatus } from '../../common/enums/service-order-status.enum.js';

export class UpdateServiceOrderDto {
  @IsMongoId()
  @IsOptional()
  machineType?: string;

  @IsString()
  @IsOptional()
  machineDetails?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsMongoId()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsOptional()
  customerNotes?: string;

  @IsBoolean()
  @IsOptional()
  warranty?: boolean;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsEnum(MachineCondition)
  @IsOptional()
  condition?: MachineCondition;

  @IsString()
  @IsOptional()
  customerProblemDesc?: string;

  @IsEnum(ServiceOrderStatus)
  @IsOptional()
  status?: ServiceOrderStatus;
}
