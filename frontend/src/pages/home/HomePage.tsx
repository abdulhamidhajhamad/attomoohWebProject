import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Award, Shield, Truck, Headphones } from 'lucide-react';
import { Section } from '../../shared/ui/Section/Section';
import { Button } from '../../shared/ui/Button/Button';
import { ProductGrid } from '../../features/products/ProductGrid/ProductGrid';
import { useProducts } from '../../shared/hooks/useProducts';
import { useSEO } from '../../shared/hooks/useSEO';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { HeroSlider } from '../../widgets/hero-slider/HeroSlider';
import { BrandSlider } from '../../widgets/brand-slider/BrandSlider';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const { products, loading: productsLoading } = useProducts();

  useSEO({
    description:
      currentLang === 'ar'
        ? 'الطموح - المورد الرائد لمعدات المطاعم والملاحم والمطابخ الصناعية. أفران، قلايات، مفارم لحوم، معدات تبريد وأكثر.'
        : 'Attomooh - Leading supplier of restaurant, butcher, and industrial kitchen equipment.',
    keywords:
      'معدات مطاعم, تجهيزات مطاعم, معدات ملاحم, تجهيزات مطابخ صناعية, restaurant equipment, commercial kitchen equipment',
  });

  const featuredProducts = products.slice(0, 8);

  const { requestWhatsApp } = useBranchSelector();

  const handleCTAClick = () => {
    const message =
      currentLang === 'ar'
        ? 'مرحباً، أرغب في الاستفسار عن تجهيزات المطابخ.'
        : 'Hello, I would like to inquire about kitchen equipment.';
    requestWhatsApp(message);
  };

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Brand Logos — آخر سكشن قبل الفوتر */}
      <BrandSlider />

      {/* Featured Products */}
      {productsLoading ? (
        <Section title={t('products.title')}>
          <LoadingSpinner />
        </Section>
      ) : featuredProducts.length > 0 ? (
        <Section
          title={t('products.title')}
          subtitle={`${t('products.showing')} 1-${featuredProducts.length} ${t('products.of')} ${products.length} ${t('products.items')}`}
        >
          <ProductGrid products={featuredProducts} />
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/products">
              <Button variant="secondary" size="lg">
                {t('general.seeAll')}
              </Button>
            </Link>
          </div>
        </Section>
      ) : null}

      {/* CTA */}
      <div className="container">
        <div className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>{t('cta.needHelp')}</h2>
          <p className={styles.ctaText}>{t('cta.helpText')}</p>
          <Button variant="whatsapp" size="lg" onClick={handleCTAClick}>
            {t('cta.whatsapp')}
          </Button>
        </div>
      </div>

      {/* Why Choose Us — آخر سكشن قبل الفوتر */}
      <Section
        title={t('about.whyUs')}
      >
        <div className={styles.trustGrid}>
          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Award size={24} />
            </div>
            <h3 className={styles.trustTitle}>{t('about.experience')}</h3>
            <p className={styles.trustText}>{t('about.experienceText')}</p>
          </div>
          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Shield size={24} />
            </div>
            <h3 className={styles.trustTitle}>{t('about.warranty')}</h3>
            <p className={styles.trustText}>{t('about.warrantyText')}</p>
          </div>
          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Truck size={24} />
            </div>
            <h3 className={styles.trustTitle}>{t('about.delivery')}</h3>
            <p className={styles.trustText}>{t('about.deliveryText')}</p>
          </div>
          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Headphones size={24} />
            </div>
            <h3 className={styles.trustTitle}>{t('about.support')}</h3>
            <p className={styles.trustText}>{t('about.supportText')}</p>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <div className="container">
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>{t('trust.clients')}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>200+</div>
            <div className={styles.statLabel}>{t('trust.products')}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>10+</div>
            <div className={styles.statLabel}>{t('trust.years')}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>{t('trust.support')}</div>
          </div>
        </div>
      </div>
    </>
  );
}
