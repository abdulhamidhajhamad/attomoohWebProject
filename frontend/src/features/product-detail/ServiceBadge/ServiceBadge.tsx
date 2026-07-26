import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import styles from './ServiceBadge.module.css';

interface ServiceBadgeProps {
  className?: string;
}

export function ServiceBadge({ className }: ServiceBadgeProps) {
  const { t } = useTranslation();

  return (
    <div className={`${styles.serviceBadge}${className ? ` ${className}` : ''}`}>
      <ShieldCheck size={18} className={styles.icon} />
      <p className={styles.text}>{t('products.peaceOfMind')}</p>
    </div>
  );
}
