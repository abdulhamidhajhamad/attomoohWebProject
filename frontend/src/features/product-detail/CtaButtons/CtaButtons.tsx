import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { useCartStore } from '../../../shared/store/cartStore';
import { useBranchSelector } from '../../../shared/ui/BranchSelector';
import { Button } from '../../../shared/ui/Button/Button';
import { generateProductInquiry } from '../../../shared/services/whatsapp';
import styles from './CtaButtons.module.css';

interface CtaButtonsProps {
  product: Product;
  lang: 'ar' | 'en';
}

export const CtaButtons = memo(function CtaButtons({
  product,
  lang,
}: CtaButtonsProps) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const { requestWhatsApp } = useBranchSelector();
  const name = product.name[lang] ?? '';

  const handleAddToCart = useCallback(() => {
    addItem(product);
  }, [addItem, product]);

  const handleInquire = useCallback(() => {
    const message = generateProductInquiry(name, lang, window.location.href);
    requestWhatsApp(message);
  }, [name, lang, requestWhatsApp]);

  return (
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
  );
});
