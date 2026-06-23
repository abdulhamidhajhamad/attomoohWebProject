import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  /* ── Create ── */

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    const category = new this.categoryModel(data);
    return category.save();
  }

  /* ── Read — flat queries ── */

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({ level: 1, createdAt: 1, _id: 1 })
      .exec();
  }

  async findById(id: Types.ObjectId): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  async findByName(name: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ 'name.ar': name }).exec();
  }

  async existsByName(name: string): Promise<boolean> {
    const category = await this.categoryModel.exists({ 'name.ar': name });
    return !!category;
  }

  /* ── Read — hierarchy queries ── */

  /** Get all root categories (level 0, no parents) */
  async findRoots(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parents: { $size: 0 } })
      .sort({ createdAt: 1, _id: 1 })
      .exec();
  }

  /** Get direct children of a parent category (categories that have parentId in their parents array) */
  async findChildren(parentId: Types.ObjectId): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parents: parentId })
      .sort({ createdAt: 1, _id: 1 })
      .exec();
  }

  /** Count direct children of a parent */
  async countChildren(parentId: Types.ObjectId): Promise<number> {
    return this.categoryModel.countDocuments({ parents: parentId }).exec();
  }

  /** Get all descendants (children + grandchildren) recursively */
  async findDescendants(parentId: Types.ObjectId): Promise<CategoryDocument[]> {
    const descendants = new Map<string, CategoryDocument>();
    const queue: Types.ObjectId[] = [parentId];
    const visited = new Set<string>([parentId.toString()]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.categoryModel
        .find({ parents: currentId })
        .exec();

      for (const child of children) {
        const childId = (child._id as Types.ObjectId).toString();
        if (!descendants.has(childId)) {
          descendants.set(childId, child);
        }

        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push(child._id as Types.ObjectId);
        }
      }
    }

    return Array.from(descendants.values());
  }

  /* ── Update ── */

  async update(
    id: Types.ObjectId,
    updateDto: UpdateCategoryDto,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, { $set: updateDto }, { returnDocument: 'after' })
      .exec();
  }

  /** Bulk-update for level recalculations */
  async updateLevel(
    id: Types.ObjectId,
    level: number,
  ): Promise<void> {
    await this.categoryModel.updateOne({ _id: id }, { $set: { level } }).exec();
  }

  /** Update the parents array of a category */
  async updateParents(
    id: Types.ObjectId,
    parents: Types.ObjectId[],
  ): Promise<void> {
    await this.categoryModel.updateOne({ _id: id }, { $set: { parents } }).exec();
  }

  /* ── Delete ── */

  async delete(id: Types.ObjectId): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async deleteByName(name: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOneAndDelete({ 'name.ar': name }).exec();
  }

  /** Delete all categories that have a given parent in their parents array */
  async deleteManyByParent(parentId: Types.ObjectId): Promise<number> {
    const result = await this.categoryModel
      .deleteMany({ parents: parentId })
      .exec();
    return result.deletedCount ?? 0;
  }

  /** Remove a specific parent from all categories that reference it */
  async removeParentFromAll(parentId: Types.ObjectId): Promise<void> {
    await this.categoryModel
      .updateMany(
        { parents: parentId },
        { $pull: { parents: parentId } },
      )
      .exec();
  }

  /** Bulk delete by IDs */
  async deleteManyByIds(ids: Types.ObjectId[]): Promise<number> {
    const result = await this.categoryModel
      .deleteMany({ _id: { $in: ids } })
      .exec();
    return result.deletedCount ?? 0;
  }
}
