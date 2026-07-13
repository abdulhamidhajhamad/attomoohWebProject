import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import styles from './ServiceBadge.module.css';

export function ServiceBadge() {
  const { t } = useTranslation();

  return (
    <div className={styles.serviceBadge}>
      <ShieldCheck size={18} className={styles.icon} />
      <p className={styles.text}>{t('products.peaceOfMind')}</p>
    </div>
  );
}
