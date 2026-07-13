import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product } from '../../../shared/types';
import { TrustBar } from '../TrustBar/TrustBar';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
  product: Product;
  categoryName: string;
  lang: 'ar' | 'en';
}

export const ProductInfo = memo(function ProductInfo({
  product,
  categoryName,
  lang,
}: ProductInfoProps) {
  const { t } = useTranslation();
  const hasPrice = (product.price ?? 0) > 0;
  const description = product.description[lang] ?? '';
  const specifications = product.specifications;

  return (
    <div className={styles.info}>
      <span className={styles.category}>{categoryName}</span>
      <h1 className={styles.productName}>{product.name[lang]}</h1>

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

      {(specifications || product.brand) && (
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
            {specifications &&
              Object.entries(specifications).map(([key, value]) => (
                <div key={key} className={styles.specRow}>
                  <span className={styles.specLabel}>{key}</span>
                  <span className={styles.specValue}>{value[lang]}</span>
                </div>
              ))}
          </div>
          <div className={styles.divider} />
        </>
      )}

      <TrustBar />
    </div>
  );
});
