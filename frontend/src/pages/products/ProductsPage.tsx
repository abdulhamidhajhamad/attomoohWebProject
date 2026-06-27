import { useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../../shared/hooks/useProducts';
import { useCategories } from '../../shared/hooks/useCategories';
import { searchProducts, getCategoryById } from '../../entities/data';
import { ProductGrid } from '../../features/products/ProductGrid/ProductGrid';
import { useSEO } from '../../shared/hooks/useSEO';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { ITEMS_PER_PAGE } from '../../shared/constants';
import styles from './ProductsPage.module.css';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const searchQuery = searchParams.get('search') || '';
  const brandQuery = searchParams.get('brand') || '';
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data from API
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { categories } = useCategories();

  const category = categorySlug
    ? getCategoryById(categories, categorySlug)
    : undefined;

  /** Get all descendant IDs of a category (for inclusive filtering) */
  const descendantIds = useMemo(() => {
    if (!categorySlug) return new Set<string>();
    const ids: string[] = [categorySlug];
    const collect = (parentId: string): void => {
      for (const c of categories) {
        if (c.parentIds.includes(parentId)) {
          ids.push(c.id);
          collect(c.id);
        }
      }
    };
    collect(categorySlug);
    return new Set(ids);
  }, [categorySlug, categories]);

  const filteredProducts = useMemo(() => {
    // ── Early exit: no filters → return raw array instantly ──
    if (!searchQuery && !categorySlug && !brandQuery) {
      return products;
    }

    // ── Cache lowercase values outside the filter loop ──
    const lowerSearch = searchQuery.toLowerCase();
    const lowerBrand = brandQuery.toLowerCase();

    // ── Single-pass filter ──
    return products.filter((p) => {
      // Category match (with descendants)
      if (categorySlug) {
        if (!p.categoryIds.some((id) => descendantIds.has(id))) return false;
      }

      // Search match
      if (searchQuery) {
        const matchesSearch =
          p.name[lang].toLowerCase().includes(lowerSearch) ||
          p.description[lang].toLowerCase().includes(lowerSearch);
        if (!matchesSearch) return false;
      }

      // Brand match
      if (brandQuery) {
        if (!p.brand || p.brand.toLowerCase() !== lowerBrand) return false;
      }

      return true;
    });
  }, [searchQuery, categorySlug, brandQuery, lang, products, descendantIds]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pageTitle = brandQuery
    ? `${brandQuery} - ${t('products.title')}`
    : category
      ? lang === 'ar'
        ? category.name.ar
        : category.name.en
      : searchQuery
        ? `${t('nav.search')}: ${searchQuery}`
        : t('products.title');

  useSEO({
    title: pageTitle,
    description: `${pageTitle} - معدات مطاعم وتجهيزات مطابخ صناعية`,
  });

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>{pageTitle}</h1>
            <p>
              {t('products.showing')} {paginatedProducts.length} {t('products.of')}{' '}
              {filteredProducts.length} {t('products.items')}
            </p>
          </div>
        </header>

        {/* ═════ Error ═════ */}
        {productsError && (
          <div className={styles.errorBox}>
            <h3>⚠️ خطأ في تحميل المنتجات</h3>
            <p>{productsError}</p>
            <p className={styles.errorHint}>
              تحقق من الاتصال بالخادم (الـ API) وتأكد من أنه يعمل على{' '}
              <code>http://localhost:3000</code>
            </p>
          </div>
        )}

        {/* ═════ Products ═════ */}
        {productsLoading ? (
          <LoadingSpinner />
        ) : paginatedProducts.length > 0 ? (
          <>
            <ProductGrid products={paginatedProducts} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ''}`}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>{t('products.noProducts')}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
