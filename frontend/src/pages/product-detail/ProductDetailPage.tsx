import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useProduct, useProducts } from '../../shared/hooks/useProducts';
import { useCategories } from '../../shared/hooks/useCategories';
import { filterProductsByCategory, getCategoryById } from '../../entities/data';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { Button } from '../../shared/ui/Button/Button';
import { Section } from '../../shared/ui/Section/Section';
import { ProductGrid } from '../../features/products/ProductGrid/ProductGrid';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { ImageGallery } from '../../features/product-detail/ImageGallery/ImageGallery';
import { ProductInfo } from '../../features/product-detail/ProductInfo/ProductInfo';
import { CtaButtons } from '../../features/product-detail/CtaButtons/CtaButtons';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { productSlug } = useParams();
  const { t } = useTranslation();
  const { currentLang, isRTL } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';

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

  useSEO({
    title: name,
    description: description,
    keywords: `${name}, ${categoryName}, معدات مطاعم, تجهيزات مطابخ`,
  });

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

  if (!product) return null;

  return (
    <div className="container">
      <div className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          <Link to="/products">{t('nav.products')}</Link>
          <ChevronLeft size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          <span className={styles.breadcrumbCurrent}>{name}</span>
        </nav>

        <div className={styles.productLayout}>
          <ImageGallery
            images={product.images}
            name={name}
            isNew={!!product.isNew}
            isOnSale={!!product.isOnSale}
            lang={lang}
            isRtl={isRTL}
          />

          <div className={styles.infoSection}>
            <ProductInfo
              product={product}
              categoryName={categoryName}
              lang={lang}
            />
            <CtaButtons product={product} lang={lang} />
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <Section title={t('products.relatedProducts')}>
            <ProductGrid products={relatedProducts} />
          </Section>
        )}
      </div>
    </div>
  );
}
