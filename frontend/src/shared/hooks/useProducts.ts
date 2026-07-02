/**
 * useProducts — Custom hooks for product data fetching
 *
 * يستخدم cache بسيط في الذاكرة لتجنب طلبات مكررة
 * كل hook يدير state خاص فيه (loading, error, data)
 * يدعم stale-while-revalidate و AbortController
 *
 * Performance:
 *  - Optimistic cache mutation on delete (no full refetch needed)
 *  - CustomEvent broadcast syncs all mounted components instantly
 *  - Focus refetch keeps stale tabs fresh without polling
 *
 * Usage:
 *   const { products, loading, error, refetch } = useProducts();
 *   const { products, loading } = useProducts(true); // admin (getAllAdmin)
 *   const { product, loading } = useProduct(productId);
 *   const { products, loading } = useProductsByCategory(categoryId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { productsService } from '../api/services';
import type { Product } from '../types';

/* ═══════════════════════════════════
   Constants
   ═══════════════════════════════════ */

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes fresh
const STALE_TTL = 10 * 60 * 1000; // 10 minutes stale (show while refetching)
const PRODUCTS_INVALIDATED_EVENT = 'products:invalidated';

/* ═══════════════════════════════════
   In-memory Cache (module-level) with stale-while-revalidate
   ═══════════════════════════════════ */

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

/* ═══════════════════════════════════
   Optimistic Cache Mutation (zero-latency)
   ═══════════════════════════════════ */

/** Remove a single product from ALL cache entries instantly (no network) */
export function removeProductFromCache(productId: string): void {
  for (const [key, entry] of productsCache) {
    if (Array.isArray(entry.data)) {
      const filtered = (entry.data as Product[]).filter(
        (p) => p.id !== productId,
      );
      if (filtered.length !== (entry.data as Product[]).length) {
        productsCache.set(key, { data: filtered, timestamp: entry.timestamp });
      }
    } else if (
      entry.data &&
      typeof entry.data === 'object' &&
      'id' in (entry.data as Record<string, unknown>)
    ) {
      if ((entry.data as Product).id === productId) {
        productsCache.delete(key);
      }
    }
  }
}

/** Invalidate all product caches and broadcast to all mounted hooks */
export function invalidateProductsCache(): void {
  productsCache.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PRODUCTS_INVALIDATED_EVENT));
  }
}

/* ═══════════════════════════════════
   Hook lifecycle helper — listens for invalidation events + focus
   ═══════════════════════════════════ */

function useInvalidationListener(refetch: () => void): void {
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener(PRODUCTS_INVALIDATED_EVENT, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener(PRODUCTS_INVALIDATED_EVENT, handler);
      window.removeEventListener('focus', handler);
    };
  }, [refetch]);
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

/**
 * @param admin  — if true, calls GET /products/admin/all (includes inactive)
 */
export function useProducts(admin = false): UseProductsResult {
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
        if (!isFresh(cacheKey)) {
          fetchProducts(true);
        }
        return;
      }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const sig = abortRef.current?.signal;
      const data = admin
        ? await productsService.getAllAdmin(sig)
        : await productsService.getAll(sig);
      if (mounted.current) {
        setProducts(data);
        setCache(cacheKey, data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل المنتجات');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  useEffect(() => {
    mounted.current = true;
    fetchProducts();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetchProducts]);

  const refetch = useCallback(() => fetchProducts(true), [fetchProducts]);

  useInvalidationListener(refetch);

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
  const fetchGen = useRef(0);

  const fetchProduct = useCallback(
    async (skipCache = false) => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }

      const cacheKey = `product-${id}`;

      if (!skipCache) {
        const cached = getCached<Product>(cacheKey);
        if (cached) {
          setProduct(cached);
          setLoading(false);
          if (!isFresh(cacheKey)) {
            fetchProduct(true);
          }
          return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const gen = ++fetchGen.current;
      setLoading(true);
      setError(null);

      try {
        const sig = abortRef.current?.signal;
        const data = await productsService.getById(id, sig);
        if (mounted.current && gen === fetchGen.current) {
          setProduct(data);
          setCache(cacheKey, data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (mounted.current && gen === fetchGen.current) {
          setError(err instanceof Error ? err.message : 'المنتج غير موجود');
        }
      } finally {
        if (mounted.current && gen === fetchGen.current) {
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

  useInvalidationListener(refetch);

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

      if (!skipCache) {
        const cached = getCached<Product[]>(cacheKey);
        if (cached) {
          setProducts(cached);
          setLoading(false);
          if (!isFresh(cacheKey)) {
            fetchProducts(true);
          }
          return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const sig = abortRef.current?.signal;
        const data = await productsService.getByCategory(categoryId, sig);
        if (mounted.current) {
          setProducts(data);
          setCache(cacheKey, data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
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

  useInvalidationListener(refetch);

  return { products, loading, error, refetch };
}
