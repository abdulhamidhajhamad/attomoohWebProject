import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryRepository } from './repositories/category.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryDocument } from './schemas/category.schema.js';
import { makeBilingual } from '../common/utils/translate.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

/** Maximum nesting depth: root (0) → sub (1) → sub-sub (2) */
const MAX_LEVEL = 2;

@Injectable()
export class CategoriesService {
  private readonly UPLOAD_FOLDER = 'attomooh/categories';
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /* ════════════════════════════════════
     CREATE — auto-calculates level from parents
     ════════════════════════════════════ */

  async create(
    dto: CreateCategoryDto,
    imageFile?: Express.Multer.File,
  ): Promise<CategoryDocument> {
    // 1. Duplicate name check (Arabic)
    const exists = await this.categoryRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    if ((dto.parentIds?.length ?? 0) > 1) {
      throw new BadRequestException('Only one parent category is allowed');
    }

    // 2. Resolve parents + calculate level
    const parentOids: Types.ObjectId[] = [];
    let level = 0;

    if (dto.parentIds && dto.parentIds.length > 0) {
      let maxParentLevel = 0;

      for (const pid of dto.parentIds) {
        const parent = await this.categoryRepository.findById(
          new Types.ObjectId(pid),
        );
        if (!parent) {
          throw new NotFoundException(`Parent category "${pid}" not found`);
        }
        parentOids.push(parent._id as Types.ObjectId);
        if (parent.level > maxParentLevel) {
          maxParentLevel = parent.level;
        }
      }

      level = maxParentLevel + 1;
      if (level > MAX_LEVEL) {
        throw new BadRequestException(
          `Maximum nesting depth is ${MAX_LEVEL} levels. Cannot add a child to a level-${maxParentLevel} category.`,
        );
      }
    }

    // 3. Auto-translate name and description
    const bilingualName = await makeBilingual(dto.name);
    const bilingualDesc = dto.description
      ? await makeBilingual(dto.description)
      : { ar: '', en: '' };

    let imageUrl = dto.image?.trim() ?? '';
    if (imageFile) {
      try {
        const uploadedImage = await this.cloudinaryService.uploadImage(
          imageFile,
          this.UPLOAD_FOLDER,
        );
        imageUrl = uploadedImage.secureUrl;
      } catch {
        // If Cloudinary is unavailable/misconfigured, keep creation working
        // by storing the selected image as inline data URL.
        imageUrl = this.toInlineDataUrl(imageFile);
        this.logger.warn(
          'Cloudinary upload failed for category image; using inline image fallback.',
        );
      }
    }

    // 4. Persist
    return this.categoryRepository.create({
      name: bilingualName,
      description: bilingualDesc,
      icon: dto.icon ?? '',
      image: imageUrl,
      parents: parentOids,
      level,
      isActive: dto.isActive ?? true,
    });
  }

  /* ════════════════════════════════════
     READ — flat + hierarchy
     ════════════════════════════════════ */

  /** All categories flat (sorted by level then name) */
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryRepository.findAll();
  }

  /** Single category by ID */
  async findById(id: Types.ObjectId): Promise<CategoryDocument> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  /** Root categories only (level 0) */
  async findRoots(): Promise<CategoryDocument[]> {
    return this.categoryRepository.findRoots();
  }

  /** Direct children of a category */
  async findChildren(parentId: Types.ObjectId): Promise<CategoryDocument[]> {
    // Verify parent exists
    const parent = await this.categoryRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }
    return this.categoryRepository.findChildren(parentId);
  }

  /** Full category tree: roots with nested children */
  async getTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.categoryRepository.findAll();
    return this.buildTree(allCategories);
  }

  /* ════════════════════════════════════
     UPDATE
     ════════════════════════════════════ */

  async update(
    id: Types.ObjectId,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Name uniqueness check (if changing name)
    if (dto.name && dto.name !== existing.name?.ar) {
      const nameExists = await this.categoryRepository.existsByName(dto.name);
      if (nameExists) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    // Parents change — recalculate levels
    if (dto.parentIds !== undefined) {
      if (dto.parentIds.length > 1) {
        throw new BadRequestException('Only one parent category is allowed');
      }

      const newParentOids: Types.ObjectId[] = [];
      let newLevel = 0;

      if (dto.parentIds.length > 0) {
        let maxParentLevel = 0;

        for (const pid of dto.parentIds) {
          const newParentOid = new Types.ObjectId(pid);

          // Prevent self-referencing
          if (newParentOid.equals(id)) {
            throw new BadRequestException('A category cannot be its own parent');
          }

          const newParent = await this.categoryRepository.findById(newParentOid);
          if (!newParent) {
            throw new NotFoundException(`Parent category "${pid}" not found`);
          }

          // Prevent circular reference (can't move under own descendant)
          const descendants = await this.categoryRepository.findDescendants(id);
          const isCircular = descendants.some((d) =>
            (d._id as Types.ObjectId).equals(newParentOid),
          );
          if (isCircular) {
            throw new BadRequestException(
              'Cannot move category under its own descendant',
            );
          }

          newParentOids.push(newParentOid);
          if (newParent.level > maxParentLevel) {
            maxParentLevel = newParent.level;
          }
        }

        newLevel = maxParentLevel + 1;
        if (newLevel > MAX_LEVEL) {
          throw new BadRequestException(
            `Maximum nesting depth is ${MAX_LEVEL} levels`,
          );
        }
      }

      // Update this category
      const updateData: Record<string, unknown> = {
        ...dto,
        parents: newParentOids,
        level: newLevel,
      };
      delete (updateData as Record<string, unknown>)['parentIds'];

      // Auto-translate if name/description changed
      if (dto.name) updateData.name = await makeBilingual(dto.name);
      if (dto.description) updateData.description = await makeBilingual(dto.description);

      const updated = await this.categoryRepository.update(id, updateData as UpdateCategoryDto);
      if (!updated) throw new NotFoundException('Category not found');

      // Cascade-update levels for all descendants
      await this.cascadeUpdateLevels(id, newLevel);

      return updated;
    }

    // Simple update (no parent change)
    const updateData: Record<string, unknown> = { ...dto };
    delete (updateData as Record<string, unknown>)['parentIds'];

    // Auto-translate if name/description changed
    if (dto.name) updateData.name = await makeBilingual(dto.name);
    if (dto.description) updateData.description = await makeBilingual(dto.description);

    const updated = await this.categoryRepository.update(id, updateData as UpdateCategoryDto);
    if (!updated) {
      throw new NotFoundException('Category not found');
    }
    return updated;
  }

  /* ════════════════════════════════════
     DELETE — cascade
     ════════════════════════════════════ */

  /** Delete a category and ALL its descendants */
  async delete(id: Types.ObjectId): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Collect all descendant IDs
    const descendants = await this.categoryRepository.findDescendants(id);
    const descendantIds = descendants.map((d) => d._id as Types.ObjectId);

    // Delete descendants first, then the category itself
    if (descendantIds.length > 0) {
      await this.categoryRepository.deleteManyByIds(descendantIds);
    }

    // Remove this category from parents arrays of any categories that reference it
    await this.categoryRepository.removeParentFromAll(id);

    await this.categoryRepository.delete(id);
  }

  async deleteByName(name: string): Promise<void> {
    const category = await this.categoryRepository.findByName(name);
    if (!category) {
      throw new NotFoundException(`Category "${name}" not found`);
    }
    await this.delete(category._id as Types.ObjectId);
  }

  /* ════════════════════════════════════
     PRIVATE HELPERS
     ════════════════════════════════════ */

  /** Build a strict tree structure from flat list (single-parent hierarchy) */
  private buildTree(categories: CategoryDocument[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();

    // Initialize all nodes
    for (const cat of categories) {
      const id = (cat._id as Types.ObjectId).toString();
      const parentStrings = (cat.parents ?? []).map((p) => p.toString());
      map.set(id, {
        _id: id,
        name: cat.name as unknown as string,
        description: cat.description as unknown as string,
        icon: cat.icon,
        image: cat.image ?? '',
        parents: parentStrings,
        level: cat.level,
        isActive: cat.isActive,
        children: [],
        createdAt: cat.createdAt?.toISOString() ?? '',
        updatedAt: cat.updatedAt?.toISOString() ?? '',
      });
    }

    // Assemble tree — each category can have one parent at most
    const roots: CategoryTreeNode[] = [];
    for (const node of map.values()) {
      if (node.parents.length === 0) {
        roots.push(node);
      } else {
        const parentId = node.parents[0];
        if (parentId && map.has(parentId)) {
          map.get(parentId)!.children.push(node);
        }
      }
    }

    return roots;
  }

  /** After moving a category, recursively fix descendant levels */
  private async cascadeUpdateLevels(
    parentId: Types.ObjectId,
    parentLevel: number,
  ): Promise<void> {
    const children = await this.categoryRepository.findChildren(parentId);
    for (const child of children) {
      const newLevel = parentLevel + 1;
      await this.categoryRepository.updateLevel(
        child._id as Types.ObjectId,
        newLevel,
      );
      await this.cascadeUpdateLevels(child._id as Types.ObjectId, newLevel);
    }
  }

  private toInlineDataUrl(file: Express.Multer.File): string {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Image upload failed and fallback image data is empty');
    }

    const mimeType = file.mimetype || 'image/jpeg';
    return `data:${mimeType};base64,${file.buffer.toString('base64')}`;
  }
}

/* ════════════════════════════════════
   Tree node type (returned by getTree)
   ════════════════════════════════════ */

export interface CategoryTreeNode {
  _id: string;
  name: unknown;
  description: unknown;
  icon: string;
  image: string;
  parents: string[];
  level: number;
  isActive: boolean;
  children: CategoryTreeNode[];
  createdAt: string;
  updatedAt: string;
}