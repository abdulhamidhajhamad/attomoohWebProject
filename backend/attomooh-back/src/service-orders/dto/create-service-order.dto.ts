import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { MachineCondition } from '../../common/enums/machine-condition.enum.js';

export class CreateServiceOrderDto {
  /* ── Machine ── */

  /** نوع الآلة (ID) — اختياري إذا أدخل يدوي */
  @IsMongoId()
  @IsOptional()
  machineType?: string;

  @IsString()
  @IsOptional()
  machineDetails?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  /* ── Customer ── */

  /** زبون محفوظ (ID) — اختياري */
  @IsMongoId()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsOptional()
  customerNotes?: string;

  /* ── Reception ── */

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
}
