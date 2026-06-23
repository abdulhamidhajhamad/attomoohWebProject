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
import {
  CloudinaryService,
  type UploadedImageFile,
} from '../cloudinary/cloudinary.service.js';

/** Maximum nesting depth: root (0) → sub (1) → sub-sub (2) */
const MAX_LEVEL = 2;
const MAX_PARENT_LINKS = 5;

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
    imageFile?: UploadedImageFile,
  ): Promise<CategoryDocument> {
    // 1. Duplicate name check (Arabic)
    const exists = await this.categoryRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    // 2. Resolve parents + calculate level
    const normalizedParentIds = this.normalizeParentIds(dto.parentIds);
    const { parentOids, level } = await this.resolveParentsForAssignment(
      normalizedParentIds,
    );

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
    imageFile?: UploadedImageFile,
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

    let imageUrl = dto.image?.trim();
    if (imageFile) {
      try {
        const uploadedImage = await this.cloudinaryService.uploadImage(
          imageFile,
          this.UPLOAD_FOLDER,
        );
        imageUrl = uploadedImage.secureUrl;
      } catch {
        // Fallback to inline data URL
        imageUrl = this.toInlineDataUrl(imageFile);
        this.logger.warn(
          'Cloudinary upload failed for category image update; using inline image fallback.',
        );
      }
    }

    // Parents change — recalculate levels
    if (dto.parentIds !== undefined) {
      const normalizedParentIds = this.normalizeParentIds(dto.parentIds);
      const { parentOids: newParentOids, level: newLevel } =
        await this.resolveParentsForAssignment(normalizedParentIds, id);

      // Update this category
      const updateData: Record<string, unknown> = {
        ...dto,
        parents: newParentOids,
        level: newLevel,
      };
      delete (updateData as Record<string, unknown>)['parentIds'];
      if (imageUrl !== undefined) updateData.image = imageUrl;

      // Auto-translate if name/description changed
      if (dto.name) updateData.name = await makeBilingual(dto.name);
      if (dto.description) updateData.description = await makeBilingual(dto.description);

      const updated = await this.categoryRepository.update(id, updateData as UpdateCategoryDto);
      if (!updated) throw new NotFoundException('Category not found');

      await this.recalculateAllLevels();
      return this.findById(id);
    }

    // Simple update (no parent change)
    const updateData: Record<string, unknown> = { ...dto };
    delete (updateData as Record<string, unknown>)['parentIds'];
    if (imageUrl !== undefined) updateData.image = imageUrl;

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

  /** Delete a category and prune descendants that become orphaned */
  async delete(id: Types.ObjectId): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Snapshot descendants before unlinking the deleted node
    const descendants = await this.categoryRepository.findDescendants(id);
    const candidateOrphanIds = new Set(
      descendants.map((d) => (d._id as Types.ObjectId).toString()),
    );

    // Detach this category from children, then delete it.
    await this.categoryRepository.removeParentFromAll(id);
    await this.categoryRepository.delete(id);

    // Delete only descendants that became orphaned (no remaining parents).
    let removedAny = true;
    while (removedAny) {
      removedAny = false;

      for (const orphanId of Array.from(candidateOrphanIds)) {
        const orphanObjectId = new Types.ObjectId(orphanId);
        const current = await this.categoryRepository.findById(orphanObjectId);

        if (!current) {
          candidateOrphanIds.delete(orphanId);
          continue;
        }

        const hasRemainingParents = (current.parents ?? []).length > 0;
        if (hasRemainingParents) {
          continue;
        }

        await this.categoryRepository.removeParentFromAll(orphanObjectId);
        await this.categoryRepository.delete(orphanObjectId);
        candidateOrphanIds.delete(orphanId);
        removedAny = true;
      }
    }

    await this.recalculateAllLevels();
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

  /** Build a tree from flat list (a category may appear under multiple parents). */
  private buildTree(categories: CategoryDocument[]): CategoryTreeNode[] {
    const nodeData = new Map<string, Omit<CategoryTreeNode, 'children'>>();
    const childrenByParent = new Map<string, string[]>();
    const rootIds: string[] = [];

    // Initialize node data and parent-to-children lookup.
    for (const cat of categories) {
      const id = (cat._id as Types.ObjectId).toString();
      const parentStrings = (cat.parents ?? []).map((p) => p.toString());

      nodeData.set(id, {
        _id: id,
        name: cat.name as unknown as string,
        description: cat.description as unknown as string,
        icon: cat.icon,
        image: cat.image ?? '',
        parents: parentStrings,
        level: cat.level,
        isActive: cat.isActive,
        createdAt: cat.createdAt?.toISOString() ?? '',
        updatedAt: cat.updatedAt?.toISOString() ?? '',
      });

      if (parentStrings.length === 0) {
        rootIds.push(id);
      }

      for (const parentId of parentStrings) {
        const current = childrenByParent.get(parentId) ?? [];
        current.push(id);
        childrenByParent.set(parentId, current);
      }
    }

    const buildNode = (id: string, lineage: Set<string>): CategoryTreeNode => {
      const baseNode = nodeData.get(id);
      if (!baseNode) {
        throw new NotFoundException(`Category node "${id}" not found while building tree`);
      }

      if (lineage.has(id)) {
        // Safety guard: avoid infinite recursion in case of malformed data.
        return { ...baseNode, children: [] };
      }

      const nextLineage = new Set(lineage);
      nextLineage.add(id);

      const childIds = Array.from(new Set(childrenByParent.get(id) ?? []));
      const children = childIds.map((childId) => buildNode(childId, nextLineage));

      return {
        ...baseNode,
        children,
      };
    };

    return rootIds.map((rootId) => buildNode(rootId, new Set()));
  }

  private normalizeParentIds(parentIds?: string[]): string[] {
    if (!parentIds || parentIds.length === 0) return [];

    return Array.from(
      new Set(parentIds.map((id) => id.trim()).filter(Boolean)),
    );
  }

  private async resolveParentsForAssignment(
    parentIds: string[],
    categoryId?: Types.ObjectId,
  ): Promise<{ parentOids: Types.ObjectId[]; level: number }> {
    if (parentIds.length === 0) {
      return { parentOids: [], level: 0 };
    }

    if (parentIds.length > MAX_PARENT_LINKS) {
      throw new BadRequestException(
        `A category can be linked to up to ${MAX_PARENT_LINKS} parent categories`,
      );
    }

    const descendantIdSet = new Set<string>();
    if (categoryId) {
      const descendants = await this.categoryRepository.findDescendants(categoryId);
      for (const descendant of descendants) {
        descendantIdSet.add((descendant._id as Types.ObjectId).toString());
      }
    }

    const parentOids: Types.ObjectId[] = [];
    const parentLevels = new Set<number>();

    for (const parentId of parentIds) {
      const parentObjectId = new Types.ObjectId(parentId);

      if (categoryId && parentObjectId.equals(categoryId)) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      const parent = await this.categoryRepository.findById(parentObjectId);
      if (!parent) {
        throw new NotFoundException(`Parent category "${parentId}" not found`);
      }

      if (categoryId && descendantIdSet.has(parentObjectId.toString())) {
        throw new BadRequestException(
          'Cannot move category under its own descendant',
        );
      }

      parentOids.push(parent._id as Types.ObjectId);
      parentLevels.add(parent.level);
    }

    if (parentLevels.size > 1) {
      throw new BadRequestException(
        'All selected parent categories must be on the same level',
      );
    }

    const parentLevel = parentLevels.values().next().value as number;
    const level = parentLevel + 1;
    if (level > MAX_LEVEL) {
      throw new BadRequestException(
        `Maximum nesting depth is ${MAX_LEVEL} levels`,
      );
    }

    return { parentOids, level };
  }

  private async recalculateAllLevels(): Promise<void> {
    const categories = await this.categoryRepository.findAll();
    if (categories.length === 0) return;

    const byId = new Map<string, CategoryDocument>();
    const parentsById = new Map<string, string[]>();

    for (const category of categories) {
      byId.set((category._id as Types.ObjectId).toString(), category);
    }

    const resolvedLevels = new Map<string, number>();
    const unresolvedIds = new Set<string>();

    for (const category of categories) {
      const categoryId = (category._id as Types.ObjectId).toString();
      const validParentIds = (category.parents ?? [])
        .map((parent) => parent.toString())
        .filter((parentId) => byId.has(parentId));

      parentsById.set(categoryId, validParentIds);

      if (validParentIds.length === 0) {
        resolvedLevels.set(categoryId, 0);
      } else {
        unresolvedIds.add(categoryId);
      }
    }

    let madeProgress = true;
    while (unresolvedIds.size > 0 && madeProgress) {
      madeProgress = false;

      for (const categoryId of Array.from(unresolvedIds)) {
        const parentIds = parentsById.get(categoryId) ?? [];
        const allParentsResolved = parentIds.every((parentId) =>
          resolvedLevels.has(parentId),
        );

        if (!allParentsResolved) continue;

        const parentLevels = parentIds.map(
          (parentId) => resolvedLevels.get(parentId) ?? 0,
        );
        const computedLevel = Math.max(...parentLevels) + 1;
        const nextLevel = Math.min(computedLevel, MAX_LEVEL);

        if (computedLevel > MAX_LEVEL) {
          this.logger.warn(
            `Category ${categoryId} exceeded max level ${MAX_LEVEL}; clamped during recalculation.`,
          );
        }

        resolvedLevels.set(categoryId, nextLevel);
        unresolvedIds.delete(categoryId);
        madeProgress = true;
      }
    }

    if (unresolvedIds.size > 0) {
      this.logger.warn(
        `Detected unresolved category hierarchy for ${unresolvedIds.size} categories; preserving current levels for those nodes.`,
      );
      for (const unresolvedId of unresolvedIds) {
        const current = byId.get(unresolvedId);
        const fallbackLevel = current ? Math.min(Math.max(current.level, 0), MAX_LEVEL) : MAX_LEVEL;
        resolvedLevels.set(unresolvedId, fallbackLevel);
      }
    }

    for (const category of categories) {
      const categoryId = (category._id as Types.ObjectId).toString();
      const nextLevel = resolvedLevels.get(categoryId) ?? 0;
      if (category.level !== nextLevel) {
        await this.categoryRepository.updateLevel(
          category._id as Types.ObjectId,
          nextLevel,
        );
      }
    }
  }

  private toInlineDataUrl(file: UploadedImageFile): string {
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