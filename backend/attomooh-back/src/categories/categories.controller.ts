import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * POST /categories
   * Create a new category — Admin only
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * GET /categories
   * Get all categories (flat list) — Public
   */
  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * GET /categories/tree
   * Get full category tree (roots → children → grandchildren) — Public
   */
  @Get('tree')
  async getTree() {
    return this.categoriesService.getTree();
  }

  /**
   * GET /categories/roots
   * Get root categories only (level 0) — Public
   */
  @Get('roots')
  async findRoots() {
    return this.categoriesService.findRoots();
  }

  /**
   * GET /categories/:id
   * Get a single category by ID — Public
   */
  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.categoriesService.findById(id);
  }

  /**
   * GET /categories/:id/children
   * Get direct children of a category — Public
   */
  @Get(':id/children')
  async findChildren(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.categoriesService.findChildren(id);
  }

  /**
   * PUT /categories/:id
   * Update a category — Admin only
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * DELETE /categories/:id
   * Delete a category and all descendants — Admin only
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.categoriesService.delete(id);
    return { message: 'Category and descendants deleted successfully' };
  }
}
