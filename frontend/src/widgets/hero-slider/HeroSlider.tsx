import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../shared/ui/Button/Button';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSliderStore } from '../../shared/store/sliderStore';
import styles from './HeroSlider.module.css';

/** Interval between auto-slides (ms) */
const AUTO_SLIDE_INTERVAL = 7000;

interface Slide {
  id: string;
  type: 'intro' | 'image';
  image?: string;
}

/**
 * HeroSlider — Auto-sliding hero carousel.
 * First slide is always the brand introduction with two CTA buttons.
 * Image slides are loaded from the slider store (admin-managed).
 */
export const HeroSlider = memo(function HeroSlider() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const { requestWhatsApp } = useBranchSelector();
  const getActiveSlides = useSliderStore((s) => s.getActiveSlides);

  // Build slides: intro first + active images from store
  const slides: Slide[] = useMemo(() => {
    const intro: Slide = { id: 'intro', type: 'intro' };
    const imageSlides: Slide[] = getActiveSlides().map((s) => ({
      id: s.id,
      type: 'image',
      image: s.secureUrl,
    }));
    return [intro, ...imageSlides];
  }, [getActiveSlides]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning],
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  const handleContactClick = () => {
    const message =
      currentLang === 'ar'
        ? 'مرحباً، أرغب في الاستفسار عن تجهيزات المطابخ.'
        : 'Hello, I would like to inquire about kitchen equipment.';
    requestWhatsApp(message);
  };

  return (
    <div className={styles.hero}>
      <div className={styles.slidesWrapper}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
          >
            {slide.type === 'intro' ? (
              /* ——— Intro Slide (Brand Introduction) ——— */
              <div className={styles.introSlide}>
                <div className={styles.introOverlay} />
                <div className={styles.introContent}>
                  <span className={styles.badge}>{t('hero.badge')}</span>
                  <h1 className={styles.title}>{t('hero.title')}</h1>
                  <p className={styles.subtitle}>{t('hero.subtitle')}</p>
                  <div className={styles.actions}>
                    <Link to="/products">
                      <Button variant="primary" size="lg">
                        {t('hero.cta')}
                      </Button>
                    </Link>
                    <Button variant="whatsapp" size="lg" onClick={handleContactClick}>
                      {t('hero.ctaSecondary')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ——— Image Slide ——— */
              <div
                className={styles.imageSlide}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className={styles.introOverlay} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (only when multiple slides) */}
      {slides.length > 1 && (
        <>
          <button
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Dots indicator (only when multiple slides) */}
      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
