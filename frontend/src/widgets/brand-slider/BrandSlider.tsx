import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BrandSlider.module.css';

/* ═══════════════════════════════════
   Brand logos — add / remove as needed.
   Import the logo and add an entry with { src, alt }.
   ═══════════════════════════════════ */
import logo2 from '../../img/logo2.png';
import logo3 from '../../img/logo3.png';
import logo4 from '../../img/logo4.png';
import logo5 from '../../img/logo5.png';
import logo6 from '../../img/logo6.png';
import logo7 from '../../img/logo7.png';
import logo8 from '../../img/ozti.png';

const BRANDS = [
  { src: logo2, alt: 'Brand 2' },
  { src: logo3, alt: 'Brand 3' },
  { src: logo4, alt: 'Brand 4' },
  { src: logo5, alt: 'Brand 5' },
  { src: logo6, alt: 'Brand 6' },
  { src: logo7, alt: 'Brand 7' },
  { src: logo8, alt: 'Brand 8' },
] as const;

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
