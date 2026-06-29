import { useState, useCallback, useMemo, useRef, useEffect, type TouchEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProduct, useProducts } from '../../shared/hooks/useProducts';
import { useCategories } from '../../shared/hooks/useCategories';
import { filterProductsByCategory, getCategoryById } from '../../entities/data';
import { useCartStore } from '../../shared/store/cartStore';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { generateProductInquiry } from '../../shared/services/whatsapp';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { Button } from '../../shared/ui/Button/Button';
import { Badge } from '../../shared/ui/Badge/Badge';
import { transformCloudinaryUrl } from '../../shared/utils/cloudinary';
import { Section } from '../../shared/ui/Section/Section';
import { ProductGrid } from '../../features/products/ProductGrid/ProductGrid';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { productSlug } = useParams();
  const { t } = useTranslation();
  const { currentLang, isRTL } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const addItem = useCartStore((s) => s.addItem);
  const [imgError, setImgError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  // Fetch product from API (productSlug is the _id from backend)
  const { product, loading, error } = useProduct(productSlug);
  const { products: allProducts } = useProducts();
  const { categories } = useCategories();

  const category = product && product.categoryIds.length > 0
    ? getCategoryById(categories, product.categoryIds[0])
    : undefined;

  const relatedProducts = useMemo(() => {
    if (!product || product.categoryIds.length === 0) return [];
    return filterProductsByCategory(allProducts, product.categoryIds[0])
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  }, [product, allProducts]);

  const name = product ? product.name[lang] : '';
  const description = product ? product.description[lang] : '';
  const categoryName = category ? category.name[lang] : '';
  const hasPrice = (product?.price ?? 0) > 0;
  const hasMultipleImages = product && product.images.length > 1;

  const sortedImages = useMemo(
    () => (product ? product.images : []),
    [product],
  );

  const processedImages = useMemo(
    () => sortedImages.map(transformCloudinaryUrl),
    [sortedImages],
  );

  // ── Auto-play: 5s interval, paused on hover, cleaned on unmount ──
  useEffect(() => {
    if (!hasMultipleImages || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedImages.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleImages, isPaused, sortedImages.length]);

  const goTo = useCallback((index: number) => setActiveIndex(index), []);
  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev + 1) % sortedImages.length),
    [sortedImages.length],
  );
  const goPrev = useCallback(
    () =>
      setActiveIndex(
        (prev) => (prev - 1 + sortedImages.length) % sortedImages.length,
      ),
    [sortedImages.length],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      const threshold = 50;
      if (Math.abs(diff) < threshold) return;
      if (diff > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  useSEO({
    title: name,
    description: description,
    keywords: `${name}, ${categoryName}, معدات مطاعم, تجهيزات مطابخ`,
  });

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product);
  }, [addItem, product]);

  const { requestWhatsApp } = useBranchSelector();

  const handleInquire = useCallback(() => {
    if (!product) return;
    const message = generateProductInquiry(name, lang);
    requestWhatsApp(message);
  }, [name, lang, product, requestWhatsApp]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '64px 0' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h1>{t('general.error')}</h1>
        <Link to="/products">
          <Button variant="primary">{t('cart.continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          <Link to="/products">{t('nav.products')}</Link>
          <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          <span className={styles.breadcrumbCurrent}>{name}</span>
        </nav>

        <div className={styles.productLayout}>
          {/* Image */}
          <div
            className={styles.imageSection}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.mainImage}>
              {sortedImages.length > 0 && !imgError ? (
                <img
                  key={activeIndex}
                  src={processedImages[activeIndex]}
                  alt={`${name} - ${activeIndex + 1}`}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.placeholder}>{name.charAt(0)}</div>
              )}

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className={`${styles.sliderArrow} ${styles.sliderArrowPrev}`}
                    onClick={goPrev}
                    aria-label={lang === 'ar' ? 'السابق' : 'Previous image'}
                  >
                    {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                  </button>
                  <button
                    type="button"
                    className={`${styles.sliderArrow} ${styles.sliderArrowNext}`}
                    onClick={goNext}
                    aria-label={lang === 'ar' ? 'التالي' : 'Next image'}
                  >
                    {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                  </button>
                </>
              )}
            </div>

            {hasMultipleImages && (
              <div className={styles.dots}>
                {sortedImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                    onClick={() => goTo(i)}
                    aria-label={`${lang === 'ar' ? 'صورة' : 'Image'} ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div className={styles.badges}>
              {product.isNew && <Badge variant="new">{t('products.new')}</Badge>}
              {product.isOnSale && <Badge variant="sale">{t('products.sale')}</Badge>}
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <span className={styles.category}>{categoryName}</span>
            <h1 className={styles.productName}>{name}</h1>

            {hasPrice && (
              <div className={styles.priceRow}>
                <span className={styles.price}>{product.price.toLocaleString()}</span>
                <span className={styles.currency}>{t('products.currency')}</span>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>
                    {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <p className={styles.description}>{description}</p>

            <div className={styles.divider} />

            {/* Specifications */}
            {(product.specifications || product.brand) && (
              <>
                <h2 className={styles.specsTitle}>{t('products.specifications')}</h2>
                <div className={styles.specsGrid}>
                  {product.brand && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        {lang === 'ar' ? 'العلامة التجارية' : 'Brand'}
                      </span>
                      <Link
                        to={`/products?brand=${encodeURIComponent(product.brand)}`}
                        className={styles.brandLink}
                      >
                        {product.brand}
                      </Link>
                    </div>
                  )}
                  {product.model && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        {lang === 'ar' ? 'الموديل' : 'Model'}
                      </span>
                      <span className={styles.specValue}>{product.model}</span>
                    </div>
                  )}
                  {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className={styles.specRow}>
                      <span className={styles.specLabel}>{key}</span>
                      <span className={styles.specValue}>{value[lang]}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.divider} />
              </>
            )}

            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart size={20} />
                {t('products.addToCart')}
              </Button>
              <Button variant="whatsapp" size="lg" onClick={handleInquire}>
                <MessageCircle size={20} />
                {t('products.inquire')}
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Section title={t('products.relatedProducts')}>
            <ProductGrid products={relatedProducts} />
          </Section>
        )}
      </div>
    </div>
  );
}
