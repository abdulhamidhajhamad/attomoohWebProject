import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsMongoId, IsEnum, IsEmail, MinLength } from 'class-validator';
import { EmployeeCategory } from '../../common/enums/employee-category.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

export class CreateEmployeeDto {
  @IsString() @IsOptional() customId?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() jobTitle?: string;
  @IsEnum(EmployeeCategory) @IsOptional() category?: EmployeeCategory;
  @IsMongoId() @IsOptional() area?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;

  /* ── System access fields (stored directly on employee) ── */
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MinLength(6) @IsOptional() password?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
}
