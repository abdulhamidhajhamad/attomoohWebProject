import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { ServiceBadge } from '../ServiceBadge/ServiceBadge';
import badgeStyles from '../ServiceBadge/ServiceBadge.module.css';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
  product: Product;
  categoryName: string;
  lang: 'ar' | 'en';
}

const MAX_VISIBLE_SPECS = 4;

export const ProductInfo = memo(function ProductInfo({
  product,
  categoryName,
  lang,
}: ProductInfoProps) {
  const { t } = useTranslation();
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const hasPrice = (product.price ?? 0) > 0;
  const description = product.description[lang] ?? '';
  const specifications = product.specifications;
  const specEntries = specifications ? Object.entries(specifications) : [];
  const hasManySpecs = specEntries.length > MAX_VISIBLE_SPECS;
  const visibleSpecs = specsExpanded
    ? specEntries
    : specEntries.slice(0, MAX_VISIBLE_SPECS);

  return (
    <div className={styles.info}>
      <ServiceBadge className={badgeStyles.desktopOnly} />
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

      {(specEntries.length > 0 || product.brand) && (
        <>
          <h2 className={styles.specsTitle}>{t('products.specifications')}</h2>
          <div
            className={`${styles.specsWrapper} ${!specsExpanded && hasManySpecs ? styles.specsCollapsed : ''}`}
          >
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
              {visibleSpecs.map(([key, value]) => (
                <div key={key} className={styles.specRow}>
                  <span className={styles.specLabel}>{key}</span>
                  <span className={styles.specValue}>{value[lang]}</span>
                </div>
              ))}
            </div>
          </div>
          {hasManySpecs && (
            <button
              type="button"
              className={styles.readMoreBtn}
              onClick={() => setSpecsExpanded((prev) => !prev)}
            >
              {specsExpanded
                ? lang === 'ar'
                  ? 'عرض أقل'
                  : 'Show Less'
                : `${lang === 'ar' ? 'عرض المزيد' : 'Show More'} (${specEntries.length - MAX_VISIBLE_SPECS})`}
              <ChevronDown
                size={16}
                className={specsExpanded ? styles.chevronUp : ''}
              />
            </button>
          )}
          <div className={styles.divider} />
        </>
      )}
    </div>
  );
});
