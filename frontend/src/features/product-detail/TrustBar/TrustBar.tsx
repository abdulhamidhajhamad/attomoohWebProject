import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Truck, Headphones, RefreshCw } from 'lucide-react';
import styles from './TrustBar.module.css';

const trustItems = [
  { key: 'warranty', icon: ShieldCheck },
  { key: 'fastDelivery', icon: Truck },
  { key: 'techSupport', icon: Headphones },
  { key: 'freeReturns', icon: RefreshCw },
] as const;

export const TrustBar = memo(function TrustBar() {
  const { t } = useTranslation();

  return (
    <div className={styles.trustBar}>
      {trustItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className={styles.trustItem}>
            <span className={styles.trustIcon}>
              <Icon size={18} />
            </span>
            <span className={styles.trustText}>
              {t(`products.${item.key}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
