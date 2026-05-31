/**
 * Categories Service — Category API calls
 *
 * GET    /categories           → جلب جميع التصنيفات (عام)
 * GET    /categories/tree      → شجرة التصنيفات الكاملة (عام)
 * GET    /categories/roots     → التصنيفات الجذرية فقط (عام)
 * GET    /categories/:id       → جلب تصنيف واحد (عام)
 * GET    /categories/:id/children → أبناء تصنيف (عام)
 * POST   /categories           → إنشاء تصنيف (أدمن)
 * PUT    /categories/:id       → تحديث تصنيف (أدمن)
 * DELETE /categories/:id       → حذف تصنيف وأبنائه (أدمن)
 */

import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import {
  mapApiCategory,
  mapApiCategories,
  mapApiCategoryForest,
} from '../mappers';
import type {
  ApiCategory,
  ApiCategoryTreeNode,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types';
import type { Category } from '../../types';

export const categoriesService = {
  /** GET /categories — flat list, Public */
  async getAll(): Promise<Category[]> {
    const data = await httpClient.get<ApiCategory[]>(
      ENDPOINTS.CATEGORIES.BASE,
    );
    return mapApiCategories(data);
  },

  /** GET /categories/tree — hierarchical tree, Public */
  async getTree(): Promise<Category[]> {
    const data = await httpClient.get<ApiCategoryTreeNode[]>(
      ENDPOINTS.CATEGORIES.TREE,
    );
    return mapApiCategoryForest(data);
  },

  /** GET /categories/roots — root categories only, Public */
  async getRoots(): Promise<Category[]> {
    const data = await httpClient.get<ApiCategory[]>(
      ENDPOINTS.CATEGORIES.ROOTS,
    );
    return mapApiCategories(data);
  },

  /** GET /categories/:id — Public */
  async getById(id: string): Promise<Category> {
    const data = await httpClient.get<ApiCategory>(
      ENDPOINTS.CATEGORIES.BY_ID(id),
    );
    return mapApiCategory(data);
  },

  /** GET /categories/:id/children — Public */
  async getChildren(parentId: string): Promise<Category[]> {
    const data = await httpClient.get<ApiCategory[]>(
      ENDPOINTS.CATEGORIES.CHILDREN(parentId),
    );
    return mapApiCategories(data);
  },

  /** POST /categories — Admin only */
  async create(category: CreateCategoryRequest): Promise<Category> {
    const formData = new FormData();
    formData.append('name', category.name);
    if (category.description) formData.append('description', category.description);
    if (category.icon) formData.append('icon', category.icon);
    if (category.image) formData.append('image', category.image);
    if (category.parentIds && category.parentIds.length > 0) {
      formData.append('parentIds', category.parentIds.join(','));
    }
    if (category.isActive !== undefined) {
      formData.append('isActive', String(category.isActive));
    }
    if (category.imageFile) {
      formData.append('imageFile', category.imageFile);
    }

    const data = await httpClient.post<ApiCategory>(
      ENDPOINTS.CATEGORIES.BASE,
      formData,
      true,
    );
    return mapApiCategory(data);
  },

  /** PUT /categories/:id — Admin only */
  async update(
    id: string,
    category: UpdateCategoryRequest,
  ): Promise<Category> {
    // If imageFile is provided, send as FormData
    if (category.imageFile) {
      const formData = new FormData();
      if (category.name) formData.append('name', category.name);
      if (category.description) formData.append('description', category.description);
      if (category.icon) formData.append('icon', category.icon);
      if (category.image) formData.append('image', category.image);
      if (category.parentIds) {
        formData.append('parentIds', category.parentIds.join(','));
      }
      if (category.isActive !== undefined) {
        formData.append('isActive', String(category.isActive));
      }
      formData.append('imageFile', category.imageFile);

      const data = await httpClient.put<ApiCategory>(
        ENDPOINTS.CATEGORIES.BY_ID(id),
        formData,
        true,
      );
      return mapApiCategory(data);
    }

    // Otherwise, send as JSON
    const data = await httpClient.put<ApiCategory>(
      ENDPOINTS.CATEGORIES.BY_ID(id),
      category,
      true,
    );
    return mapApiCategory(data);
  },

  /** DELETE /categories/:id — Admin only (cascade deletes children) */
  async deleteById(id: string): Promise<void> {
    await httpClient.delete<{ message: string }>(
      ENDPOINTS.CATEGORIES.BY_ID(id),
      true,
    );
  },
} as const;
