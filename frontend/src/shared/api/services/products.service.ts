/**
 * Products Service — Product API calls
 *
 * GET    /products                    → جلب جميع المنتجات (عام)
 * GET    /products/:id                → جلب منتج واحد (عام)
 * GET    /products/category/:catId    → جلب منتجات حسب التصنيف (عام)
 * POST   /products                    → إنشاء منتج (أدمن — multipart/form-data)
 * PATCH  /products/:id                → تعديل منتج (أدمن — multipart/form-data)
 * DELETE /products/:id                → حذف منتج (أدمن)
 *
 * ملاحظة: الباك اند يتعامل مع رفع الصور إلى Cloudinary تلقائياً
 *         فقط أرسل الملفات مباشرة عبر FormData
 */

import { httpClient } from '../httpClient';
import { ENDPOINTS } from '../endpoints';
import { mapApiProduct, mapApiProducts } from '../mappers';
import type { ApiProduct, CreateProductPayload, UpdateProductPayload } from '../types';
import type { Product } from '../../types';

export const productsService = {
  /** GET /products — Public */
  async getAll(signal?: AbortSignal): Promise<Product[]> {
    const data = await httpClient.get<ApiProduct[]>(ENDPOINTS.PRODUCTS.BASE, false, undefined, signal);
    return mapApiProducts(data);
  },

  /** GET /products/:id — Public */
  async getById(id: string, signal?: AbortSignal): Promise<Product> {
    const data = await httpClient.get<ApiProduct>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
      false,
      undefined,
      signal,
    );
    return mapApiProduct(data);
  },

  /** GET /products/category/:categoryId — Public */
  async getByCategory(categoryId: string, signal?: AbortSignal): Promise<Product[]> {
    const data = await httpClient.get<ApiProduct[]>(
      ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId),
      false,
      undefined,
      signal,
    );
    return mapApiProducts(data);
  },

  /**
   * POST /products — Admin only
   * Sends files via FormData — backend uploads to Cloudinary
   */
  async create(payload: CreateProductPayload, signal?: AbortSignal): Promise<Product> {
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('brand', payload.brand);
    fd.append('model', payload.model);
    fd.append('price', String(payload.price));
    fd.append('categories', payload.categories.join(','));
    if (payload.isActive !== undefined) {
      fd.append('isActive', String(payload.isActive));
    }

    if (payload.specifications) {
      fd.append('specifications', JSON.stringify(payload.specifications));
    }

    for (const file of payload.images) {
      fd.append('images', file);
    }

    const data = await httpClient.post<ApiProduct>(
      ENDPOINTS.PRODUCTS.BASE,
      fd,
      true,
      undefined,
      signal,
    );
    return mapApiProduct(data);
  },

  /**
   * PATCH /products/:id — Admin only
   * Sends files via FormData — backend uploads to Cloudinary
   */
  async update(id: string, payload: UpdateProductPayload, signal?: AbortSignal): Promise<Product> {
    const fd = new FormData();

    if (payload.name) fd.append('name', payload.name);
    if (payload.brand !== undefined) fd.append('brand', payload.brand);
    if (payload.model) fd.append('model', payload.model);
    if (payload.price !== undefined) fd.append('price', String(payload.price));
    if (payload.categories && payload.categories.length > 0) {
      fd.append('categories', payload.categories.join(','));
    }
    if (payload.specifications) {
      fd.append('specifications', JSON.stringify(payload.specifications));
    }
    if (payload.images) {
      for (const file of payload.images) {
        fd.append('images', file);
      }
    }

    const data = await httpClient.patch<ApiProduct>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
      fd,
      true,
      undefined,
      signal,
    );
    return mapApiProduct(data);
  },

  /** DELETE /products/:id — Admin only */
  async delete(id: string, signal?: AbortSignal): Promise<void> {
    await httpClient.delete<{ message: string }>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
      true,
      undefined,
      signal,
    );
  },
} as const;
