import { useState, useCallback, useMemo, useRef, useEffect, memo, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { transformCloudinaryUrl } from '../../../shared/utils/cloudinary';
import { ServiceBadge } from '../ServiceBadge/ServiceBadge';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
  images: string[];
  name: string;
  isNew: boolean;
  isOnSale: boolean;
  lang: 'ar' | 'en';
  isRtl: boolean;
}

export const ImageGallery = memo(function ImageGallery({
  images,
  name,
  isNew,
  isOnSale,
  lang,
  isRtl,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const hasMultipleImages = images.length > 1;
  const currentImage = images[activeIndex] ?? '';

  const processedImage = useMemo(
    () => transformCloudinaryUrl(currentImage, 600),
    [currentImage],
  );

  useEffect(() => {
    if (!hasMultipleImages || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleImages, isPaused, images.length]);

  const goTo = useCallback((index: number) => setActiveIndex(index), []);
  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev + 1) % images.length),
    [images.length],
  );
  const goPrev = useCallback(
    () =>
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length),
    [images.length],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      const threshold = 50;
      if (Math.abs(diff) < threshold) return;
      if (diff > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  return (
    <div
      className={styles.imageSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.mainImage}>
        {currentImage && !imgError ? (
          <img
            key={activeIndex}
            src={processedImage}
            alt={`${name} - ${activeIndex + 1}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.placeholder}>{name.charAt(0)}</div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              className={`${styles.sliderArrow} ${styles.sliderArrowPrev}`}
              onClick={goPrev}
              aria-label={lang === 'ar' ? 'السابق' : 'Previous image'}
            >
              {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              type="button"
              className={`${styles.sliderArrow} ${styles.sliderArrowNext}`}
              onClick={goNext}
              aria-label={lang === 'ar' ? 'التالي' : 'Next image'}
            >
              {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${lang === 'ar' ? 'صورة' : 'Image'} ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className={styles.badges}>
        {isNew && <Badge variant="new">{lang === 'ar' ? 'جديد' : 'New'}</Badge>}
        {isOnSale && <Badge variant="sale">{lang === 'ar' ? 'خصم' : 'Sale'}</Badge>}
      </div>

      <ServiceBadge />
    </div>
  );
});
