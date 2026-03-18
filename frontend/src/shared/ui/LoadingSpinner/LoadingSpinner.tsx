import { useTranslation } from 'react-i18next';
import styles from './LoadingSpinner.module.css';

export function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <div className={styles.spinner} role="status" aria-label={t('general.loading')}>
      <div className={styles.spinnerIcon} />
      <span className={styles.spinnerText}>{t('general.loading')}</span>
    </div>
  );
}
