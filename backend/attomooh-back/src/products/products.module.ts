import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema.js';
import { ProductRepository } from './repositories/product.repository.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { CategoriesModule } from '../categories/categories.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
