import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAreaDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  village?: string;

  @IsString()
  @IsOptional()
  phonePrefix?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
