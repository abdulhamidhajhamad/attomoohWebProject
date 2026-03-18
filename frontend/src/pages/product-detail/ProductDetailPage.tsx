import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, MessageCircle, Minus, Plus, ChevronLeft } from 'lucide-react';
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
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

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

  useSEO({
    title: name,
    description: description,
    keywords: `${name}, ${categoryName}, معدات مطاعم, تجهيزات مطابخ`,
  });

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  }, [addItem, product, quantity]);

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

  if (error || !product) {
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
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {product.images[0] && !imgError ? (
                <img
                  src={product.images[0]}
                  alt={name}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.placeholder}>{name.charAt(0)}</div>
              )}
            </div>
            <div className={styles.badges}>
              {product.isNew && <Badge variant="new">{t('products.new')}</Badge>}
              {product.isOnSale && <Badge variant="sale">{t('products.sale')}</Badge>}
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <span className={styles.category}>{categoryName}</span>
            <h1 className={styles.productName}>{name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>{product.price.toLocaleString()}</span>
              <span className={styles.currency}>{t('products.currency')}</span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>
                  {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className={styles.description}>{description}</p>

            <div className={styles.divider} />

            {/* Specifications */}
            {product.specifications && (
              <>
                <h2 className={styles.specsTitle}>{t('products.specifications')}</h2>
                <div className={styles.specsGrid}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className={styles.specRow}>
                      <span className={styles.specLabel}>{key}</span>
                      <span className={styles.specValue}>{value[lang]}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.divider} />
              </>
            )}

            {/* Quantity & Actions */}
            <div className={styles.quantityControl}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={18} />
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={18} />
              </button>
            </div>

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
