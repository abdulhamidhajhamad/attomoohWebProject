import {
  IsArray,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class UpdateProductOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => ProductOrderItemDto)
  products: ProductOrderItemDto[];
}
