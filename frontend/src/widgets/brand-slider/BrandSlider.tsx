import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BrandSlider.module.css';

const brandModules = import.meta.glob(
  '../../img/brands/*.{png,jpg,jpeg,webp,svg}',
  { eager: true },
);

const BRANDS = Object.entries(brandModules).map(([path, mod]) => ({
  src: (mod as { default: string }).default,
  alt: path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Brand',
}));

/**
 * BrandSlider — infinite auto-scrolling marquee of brand logos.
 *
 * Technique: pure-CSS `@keyframes` scroll.  The track is duplicated once
 * so the animation loops seamlessly.  No JS timers / requestAnimationFrame.
 *
 * ┌─ .track (flex, animate translateX) ─────────────────────┐
 * │  [logos...]  [logos... (duplicate for seamless loop)]    │
 * └─────────────────────────────────────────────────────────┘
 */
export const BrandSlider = memo(function BrandSlider() {
  const { t } = useTranslation();

  if (BRANDS.length === 0) return null;

  return (
    <section className={styles.section} aria-label={t('brands.title')}>
      <div className="container">
        <h2 className={styles.title}>{t('brands.title')}</h2>
        <p className={styles.subtitle}>{t('brands.subtitle')}</p>
      </div>

      <div className={styles.slider}>
        {/* Fade edges */}
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />

        {/* Scrolling track — 2 identical sets for seamless infinite loop */}
        <div className={styles.track}>
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <div key={i} className={styles.logoWrapper}>
              <img
                src={brand.src}
                alt={brand.alt}
                className={styles.logo}
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
