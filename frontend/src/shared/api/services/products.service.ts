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
  async getAll(): Promise<Product[]> {
    const data = await httpClient.get<ApiProduct[]>(ENDPOINTS.PRODUCTS.BASE);
    return mapApiProducts(data);
  },

  /** GET /products/:id — Public */
  async getById(id: string): Promise<Product> {
    const data = await httpClient.get<ApiProduct>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
    );
    return mapApiProduct(data);
  },

  /** GET /products/category/:categoryId — Public */
  async getByCategory(categoryId: string): Promise<Product[]> {
    const data = await httpClient.get<ApiProduct[]>(
      ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId),
    );
    return mapApiProducts(data);
  },

  /**
   * POST /products — Admin only
   * Sends files via FormData — backend uploads to Cloudinary
   */
  async create(payload: CreateProductPayload): Promise<Product> {
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('model', payload.model);
    fd.append('price', String(payload.price));
    fd.append('categories', payload.categories.join(','));

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
    );
    return mapApiProduct(data);
  },

  /**
   * PATCH /products/:id — Admin only
   * Sends files via FormData — backend uploads to Cloudinary
   */
  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const fd = new FormData();

    if (payload.name) fd.append('name', payload.name);
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
    );
    return mapApiProduct(data);
  },

  /** DELETE /products/:id — Admin only */
  async delete(id: string): Promise<void> {
    await httpClient.delete<{ message: string }>(
      ENDPOINTS.PRODUCTS.BY_ID(id),
      true,
    );
  },
} as const;
