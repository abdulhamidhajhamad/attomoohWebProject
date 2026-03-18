import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCartStore } from '../../shared/store/cartStore';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { generateQuoteMessage } from '../../shared/services/whatsapp';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { Button } from '../../shared/ui/Button/Button';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } =
    useCartStore();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useSEO({ title: t('cart.title') });

  const handleImageError = useCallback((id: string) => {
    setImgErrors((prev) => new Set(prev).add(id));
  }, []);

  const { requestWhatsApp } = useBranchSelector();

  const handleRequestQuote = useCallback(() => {
    const message = generateQuoteMessage(items, lang);
    requestWhatsApp(message);
    clearCart();
  }, [items, lang, clearCart, requestWhatsApp]);

  if (items.length === 0) {
    return (
      <div className="container">
        <div className={styles.page}>
          <h1 className={styles.pageTitle}>{t('cart.title')}</h1>
          <div className={styles.empty}>
            <ShoppingCart size={64} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>{t('cart.empty')}</h2>
            <p className={styles.emptyText}>{t('cart.emptyDesc')}</p>
            <Link to="/products">
              <Button variant="primary" size="lg">
                {t('cart.continueShopping')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>
          {t('cart.title')} ({totalItems()} {t('cart.itemCount')})
        </h1>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.itemsList}>
            {items.map((item) => {
              const name = item.product.name[lang];
              return (
                <div key={item.product.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.product.images[0] && !imgErrors.has(item.product.id) ? (
                      <img
                        src={item.product.images[0]}
                        alt={name}
                        loading="lazy"
                        onError={() => handleImageError(item.product.id)}
                      />
                    ) : (
                      <span className={styles.itemPlaceholder}>{name.charAt(0)}</span>
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{name}</h3>
                    <span className={styles.itemPrice}>
                      {item.product.price.toLocaleString()} {t('products.currency')}
                    </span>

                    <div className={styles.itemControls}>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                            )
                          }
                          aria-label="Decrease"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                            )
                          }
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.product.id)}
                        aria-label={t('cart.remove')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>{t('cart.title')}</h2>

            {items.map((item) => (
              <div key={item.product.id} className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  {item.product.name[lang]} ×{item.quantity}
                </span>
                <span className={styles.summaryValue}>
                  {(item.product.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{t('cart.total')}</span>
              <span className={styles.totalValue}>
                {totalPrice().toLocaleString()} {t('products.currency')}
              </span>
            </div>

            <div className={styles.summaryActions}>
              <Button
                variant="whatsapp"
                size="lg"
                fullWidth
                onClick={handleRequestQuote}
              >
                <MessageCircle size={20} />
                {t('cart.requestQuote')}
              </Button>
              <Link to="/products">
                <Button variant="ghost" size="md" fullWidth>
                  {t('cart.continueShopping')}
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
