import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { Types } from 'mongoose';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * POST /api/products
   * Create a new product with images — Admin only
   * Body: multipart/form-data
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|jpg)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    const result = await this.productsService.create(createProductDto, files);
    return result;
  }

  /**
   * GET /api/products
   * Get all products — Public
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Res({ passthrough: true }) res: Response) {
    const result = await this.productsService.findAll();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return result;
  }

  /**
   * GET /api/products/:id
   * Get a single product by ID — Public
   */
  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Res({ passthrough: true }) res: Response) {
    const result = await this.productsService.findById(id);
    res.setHeader('Cache-Control', 'public, max-age=60');
    return result;
  }

  /**
   * GET /api/products/category/:categoryId
   * Get all products by category — Public
   */
  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId', ParseObjectIdPipe) categoryId: Types.ObjectId,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.productsService.findByCategory(categoryId);
    res.setHeader('Cache-Control', 'public, max-age=60');
    return result;
  }

  /**
   * PATCH /products/:id
   * Update a product — Admin only
   * Body: multipart/form-data (images optional)
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  /**
   * DELETE /products/:id
   * Delete a product — Admin only
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
