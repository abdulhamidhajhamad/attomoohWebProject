/**
 * useProducts — Custom hooks for product data fetching
 *
 * يستخدم cache بسيط في الذاكرة لتجنب طلبات مكررة
 * كل hook يدير state خاص فيه (loading, error, data)
 * يدعم stale-while-revalidate و AbortController
 *
 * Usage:
 *   const { products, loading, error, refetch } = useProducts();
 *   const { product, loading } = useProduct(productId);
 *   const { products, loading } = useProductsByCategory(categoryId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { productsService } from '../api/services';
import type { Product } from '../types';

/* ═══════════════════════════════════
   In-memory Cache (module-level) with stale-while-revalidate
   ═══════════════════════════════════ */

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes fresh
const STALE_TTL = 10 * 60 * 1000; // 10 minutes stale (show while refetching)

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const productsCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = productsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > STALE_TTL) {
    productsCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function isFresh(key: string): boolean {
  const entry = productsCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp <= CACHE_TTL;
}

function setCache(key: string, data: unknown): void {
  productsCache.set(key, { data, timestamp: Date.now() });
}

/** Invalidate all product caches */
export function invalidateProductsCache(): void {
  productsCache.clear();
}

/* ═══════════════════════════════════
   Hook: useProducts (all products)
   ═══════════════════════════════════ */

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async (skipCache = false) => {
    const cacheKey = 'all-products';

    // ── Stale-while-revalidate: show cached data immediately ──
    if (!skipCache) {
      const cached = getCached<Product[]>(cacheKey);
      if (cached) {
        setProducts(cached);
        setLoading(false);
        // If stale, trigger background refetch
        if (!isFresh(cacheKey)) {
          fetchProducts(true); // background refetch
        }
        return;
      }
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const controller = abortRef.current;
      const data = await productsService.getAll(controller?.signal);
      if (mounted.current) {
        setProducts(data);
        setCache(cacheKey, data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل المنتجات');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchProducts();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetchProducts]);

  const refetch = useCallback(() => fetchProducts(true), [fetchProducts]);

  return { products, loading, error, refetch };
}

/* ═══════════════════════════════════
   Hook: useProduct (single product)
   ═══════════════════════════════════ */

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProduct(id: string | undefined): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProduct = useCallback(
    async (skipCache = false) => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }

      const cacheKey = `product-${id}`;

      // ── Stale-while-revalidate: show cached data immediately ──
      if (!skipCache) {
        const cached = getCached<Product>(cacheKey);
        if (cached) {
          setProduct(cached);
          setLoading(false);
          // If stale, trigger background refetch
          if (!isFresh(cacheKey)) {
            fetchProduct(true); // background refetch
          }
          return;
        }
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const controller = abortRef.current;
        const data = await productsService.getById(id, controller?.signal);
        if (mounted.current) {
          setProduct(data);
          setCache(cacheKey, data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        if (mounted.current) {
          setError(err instanceof Error ? err.message : 'المنتج غير موجود');
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    mounted.current = true;
    fetchProduct();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetchProduct]);

  const refetch = useCallback(() => fetchProduct(true), [fetchProduct]);

  return { product, loading, error, refetch };
}

/* ═══════════════════════════════════
   Hook: useProductsByCategory
   ═══════════════════════════════════ */

export function useProductsByCategory(
  categoryId: string | undefined,
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(
    async (skipCache = false) => {
      if (!categoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const cacheKey = `products-by-cat-${categoryId}`;

      // ── Stale-while-revalidate: show cached data immediately ──
      if (!skipCache) {
        const cached = getCached<Product[]>(cacheKey);
        if (cached) {
          setProducts(cached);
          setLoading(false);
          // If stale, trigger background refetch
          if (!isFresh(cacheKey)) {
            fetchProducts(true); // background refetch
          }
          return;
        }
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const controller = abortRef.current;
        const data = await productsService.getByCategory(categoryId, controller?.signal);
        if (mounted.current) {
          setProducts(data);
          setCache(cacheKey, data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        if (mounted.current) {
          setError(
            err instanceof Error ? err.message : 'فشل في تحميل المنتجات',
          );
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [categoryId],
  );

  useEffect(() => {
    mounted.current = true;
    fetchProducts();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetchProducts]);

  const refetch = useCallback(() => fetchProducts(true), [fetchProducts]);

  return { products, loading, error, refetch };
}
