import {
  IsArray,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChildOrderItemDto {
  @IsMongoId()
  subCategoryId: string;

  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class UpdateChildrenOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => ChildOrderItemDto)
  children: ChildOrderItemDto[];
}
