import { memo, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { useCartStore } from '../../../shared/store/cartStore';
import { useLocalizedValue } from '../../../shared/hooks/useLocalizedValue';
import { useCategories } from '../../../shared/hooks/useCategories';
import { generateProductInquiry } from '../../../shared/services/whatsapp';
import { useBranchSelector } from '../../../shared/ui/BranchSelector';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { transformCloudinaryUrl } from '../../../shared/utils/cloudinary';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const name = useLocalizedValue(product.name);
  const addItem = useCartStore((s) => s.addItem);
  const [imgError, setImgError] = useState(false);
  const lang = i18n.language as 'ar' | 'en';
  const { categories } = useCategories();

  const category = categories.find((c) => product.categoryIds.includes(c.id));
  const categoryName = category
    ? lang === 'ar'
      ? category.name.ar
      : category.name.en
    : '';
  const hasPrice = product.price > 0;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem(product);
    },
    [addItem, product],
  );

  const { requestWhatsApp } = useBranchSelector();

  const handleInquire = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const productUrl = `${window.location.origin}/products/${product.slug}`;
      const message = generateProductInquiry(name, lang, productUrl);
      requestWhatsApp(message);
    },
    [name, lang, product.slug, requestWhatsApp],
  );

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug}`} aria-label={name}>
        <div className={styles.imageWrapper}>
          {product.images[0] && !imgError ? (
            <img
              src={transformCloudinaryUrl(product.images[0])}
              alt={name}
              className={styles.image}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={styles.placeholder}>
              {name.charAt(0)}
            </div>
          )}
          <div className={styles.badges}>
            {product.isNew && <Badge variant="new">{t('products.new')}</Badge>}
            {product.isOnSale && <Badge variant="sale">{t('products.sale')}</Badge>}
            {!product.inStock && (
              <Badge variant="outOfStock">{t('products.outOfStock')}</Badge>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <span className={styles.category}>{categoryName}</span>
          {product.brand && (
            <span className={styles.brand}>{product.brand}</span>
          )}
          <h3 className={styles.name}>{name}</h3>
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
        </div>
      </Link>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          aria-label={t('products.addToCart')}
        >
          <ShoppingCart size={16} />
        </Button>
        <Button variant="primary" size="sm" onClick={handleInquire}>
          <MessageCircle size={16} />
          {t('products.inquireShort')}
        </Button>
      </div>
    </article>
  );
});
