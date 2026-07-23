import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateChildrenOrderDto } from './dto/children-order.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verify that the request carries a valid admin JWT.
   * Used to gate the ?showInactive=true query param.
   */
  private async isAdmin(req: unknown): Promise<boolean> {
    try {
      const headers = (req as Record<string, unknown>)?.headers as Record<string, string | undefined> | undefined;
      const authHeader = headers?.authorization;
      if (!authHeader) return false;
      const token = authHeader.replace('Bearer ', '');
      const payload = await this.jwtService.verifyAsync(token);
      return payload.role === UserRole.ADMIN;
    } catch {
      return false;
    }
  }

  /**
   * POST /categories
   * Create a new category — Admin only
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('imageFile'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|jpg)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    imageFile?: Express.Multer.File,
  ) {
    return this.categoriesService.create(createCategoryDto, imageFile);
  }

  /**
   * GET /categories
   * Get all categories (flat list) — Public
   * Admins can pass ?showInactive=true to include deactivated categories.
   */
  @Get()
  async findAll(
    @Query('showInactive') showInactive?: string,
    @Req() req?: unknown,
  ) {
    const activeOnly = !(showInactive === 'true' && await this.isAdmin(req));
    return this.categoriesService.findAll(activeOnly);
  }

  /**
   * GET /categories/tree
   * Get full category tree (roots → children → grandchildren) — Public
   * Admins can pass ?showInactive=true to include deactivated categories.
   */
  @Get('tree')
  async getTree(
    @Query('showInactive') showInactive?: string,
    @Req() req?: unknown,
  ) {
    const activeOnly = !(showInactive === 'true' && await this.isAdmin(req));
    return this.categoriesService.getTree(activeOnly);
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
  @UseInterceptors(FileInterceptor('imageFile'))
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|jpg)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    imageFile?: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, imageFile);
  }

  /**
   * PUT /categories/:id/children-order
   * Update the display order of children under a parent — Admin only
   */
  @Put(':id/children-order')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateChildrenOrder(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateChildrenOrderDto,
  ) {
    return this.categoriesService.updateChildrenOrder(id, dto);
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
