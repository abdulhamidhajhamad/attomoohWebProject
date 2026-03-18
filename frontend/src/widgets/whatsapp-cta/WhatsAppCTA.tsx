import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import styles from './WhatsAppCTA.module.css';

export const WhatsAppCTA = memo(function WhatsAppCTA() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const { requestWhatsApp } = useBranchSelector();

  const handleClick = () => {
    const message =
      currentLang === 'ar'
        ? 'مرحباً، أرغب في الاستفسار عن منتجاتكم.'
        : 'Hello, I would like to inquire about your products.';
    requestWhatsApp(message);
  };

  return (
    <button
      className={styles.whatsappCta}
      onClick={handleClick}
      aria-label={t('cta.whatsapp')}
    >
      <MessageCircle size={24} className={styles.whatsappIcon} />
      <span className={styles.whatsappText}>{t('cta.whatsapp')}</span>
    </button>
  );
});
