import { IsString, IsOptional, IsBoolean, IsMongoId, IsEnum, IsEmail } from 'class-validator';
import { EmployeeCategory } from '../../common/enums/employee-category.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../../common/enums/technician-status.enum.js';

export class UpdateEmployeeDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() jobTitle?: string;
  @IsEnum(EmployeeCategory) @IsOptional() category?: EmployeeCategory;
  @IsMongoId() @IsOptional() area?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;

  /* ── System access fields ── */
  @IsEmail() @IsOptional() email?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @IsEnum(TechnicianStatus) @IsOptional() technicianStatus?: TechnicianStatus;
}
