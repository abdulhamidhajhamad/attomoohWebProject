import {
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useCategories } from '../../shared/hooks/useCategories';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { getLucideIcon, DefaultCategoryIcon } from '../../shared/ui/IconResolver';
import type { Category } from '../../shared/types';
import styles from './CategoriesPage.module.css';

const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';
const DEFAULT_CIRCLE_BG = '#f0f0ec';

const looksLikeCloudinaryImage = (url: string) =>
  /res\.cloudinary\.com\/.+\/image\/upload\//.test(url);

const splitUrlParts = (url: string) => {
  const [withoutHash, hash] = url.split('#', 2);
  const [path, query] = withoutHash.split('?', 2);
  return {
    path,
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
};

const optimizeCategoryImageUrl = (imageUrl: string, size: number) => {
  if (!imageUrl || imageUrl.startsWith('data:') || !looksLikeCloudinaryImage(imageUrl)) {
    return imageUrl;
  }

  const { path, query, hash } = splitUrlParts(imageUrl);
  if (!path.includes(CLOUDINARY_UPLOAD_MARKER)) return imageUrl;

  const safeSize = Math.max(64, Math.round(size));
  const transforms = [
    `f_auto`,
    `q_auto:best`,
    `dpr_auto`,
    `c_fit`,
    `w_${safeSize}`,
    `h_${safeSize}`,
    'fl_progressive',
  ].join(',');

  const optimizedPath = path.replace(
    CLOUDINARY_UPLOAD_MARKER,
    `${CLOUDINARY_UPLOAD_MARKER}${transforms}/`,
  );
  return `${optimizedPath}${query}${hash}`;
};

const getCategoryImageSources = (imageUrl: string) => {
  const src = optimizeCategoryImageUrl(imageUrl, 280);
  const src2x = optimizeCategoryImageUrl(imageUrl, 560);
  return {
    src,
    srcSet: src !== src2x ? `${src} 1x, ${src2x} 2x` : undefined,
  };
};

const sampleEdgeBackgroundColor = (image: HTMLImageElement): string | null => {
  try {
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    if (!naturalWidth || !naturalHeight) return null;

    const sampleLimit = 128;
    const scale = Math.min(1, sampleLimit / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(4, Math.round(naturalWidth * scale));
    const height = Math.max(4, Math.round(naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;

    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    const sampleAt = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3];
      if (alpha < 24) return;

      red += pixels[i];
      green += pixels[i + 1];
      blue += pixels[i + 2];
      count += 1;
    };

    const step = Math.max(1, Math.floor(Math.min(width, height) / 24));

    for (let x = 0; x < width; x += step) {
      sampleAt(x, 0);
      sampleAt(x, height - 1);
    }

    for (let y = 0; y < height; y += step) {
      sampleAt(0, y);
      sampleAt(width - 1, y);
    }

    if (!count) return null;

    return `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})`;
  } catch {
    return null;
  }
};

interface CategoryCircleImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
}

function CategoryCircleImage({ src, srcSet, sizes, alt }: CategoryCircleImageProps) {
  const [bgColor, setBgColor] = useState(DEFAULT_CIRCLE_BG);

  const handleLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const sampled = sampleEdgeBackgroundColor(event.currentTarget);
    if (sampled) setBgColor(sampled);
  }, []);

  const mediaStyle = {
    '--circle-bg': bgColor,
  } as CSSProperties;

  return (
    <span className={styles.circleMedia} style={mediaStyle}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={styles.circleImage}
        loading="lazy"
        decoding="async"
        crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
        onLoad={handleLoad}
      />
    </span>
  );
}

const catName = (c: Category, lang: 'ar' | 'en') =>
  lang === 'ar' ? c.name.ar : c.name.en;

const getDefaultDescription = (cat: Category) => {
  const key = `${cat.icon ?? ''} ${cat.slug}`.toLowerCase();

  if (key.includes('utensilscrossed') || key.includes('cooking')) {
    return 'أفران، قلايات، شوايات، طناجر ومعدات الطهي الاحترافية';
  }

  if (key.includes('beef') || key.includes('meat')) {
    return 'مفارم، شرائح اللحم، تعبئة السجق، وحدات تعتيق اللحوم';
  }

  if (key.includes('croissant') || key.includes('bakery')) {
    return 'أفران الخبز، عجانات، ممدات العجين ومعدات الحلويات';
  }

  if (key.includes('coffee') || key.includes('bar')) {
    return 'ماكينات القهوة، خلاطات، معدات التحضير والتقديم';
  }

  if (key.includes('thermometer') || key.includes('cold')) {
    return 'ثلاجات، فريزرات، عربات تبريد ووحدات التخزين البارد';
  }

  if (key.includes('grid') || key.includes('steel')) {
    return 'طاولات، رفوف، أحواض غسيل ومعدات الستانلس ستيل';
  }

  return '';
};

const childrenOf = (parentId: string, all: Category[]) =>
  all.filter((c) => c.parentIds.includes(parentId));

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const isRtl = lang === 'ar';
  const { categories, categoryTree, loading, error } = useCategories();

  const [breadcrumbIds, setBreadcrumbIds] = useState<string[]>([]);

  const breadcrumbs = useMemo(
    () =>
      breadcrumbIds
        .map((id) => categories.find((c) => c.id === id))
        .filter(Boolean) as Category[],
    [breadcrumbIds, categories],
  );

  const currentItems = useMemo(() => {
    if (!breadcrumbIds.length) return categoryTree;
    return childrenOf(breadcrumbIds[breadcrumbIds.length - 1], categories);
  }, [breadcrumbIds, categoryTree, categories]);

  const hasChildren = useCallback(
    (id: string) => categories.some((c) => c.parentIds.includes(id)),
    [categories],
  );

  const drillInto = useCallback(
    (cat: Category) => hasChildren(cat.id) && setBreadcrumbIds((p) => [...p, cat.id]),
    [hasChildren],
  );

  const goToLevel = useCallback(
    (i: number) => setBreadcrumbIds((p) => p.slice(0, i + 1)),
    [],
  );

  const goToRoot = useCallback(() => setBreadcrumbIds([]), []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const isSubcategoryView = breadcrumbIds.length > 0;
  const currentTitle =
    breadcrumbs.length > 0
      ? catName(breadcrumbs[breadcrumbs.length - 1], lang)
      : t('categories.title');

  useSEO({
    title: `${t('categories.title')} | ${currentTitle}`,
    description:
      'تصفح جميع تصنيفات معدات المطابخ الصناعية - أفران، قلايات، مفارم لحوم، تبريد والمزيد',
  });

  const renderCategoryItem = (cat: Category) => {
    const isLeaf = !hasChildren(cat.id);
    const Icon = getLucideIcon(cat.icon) ?? DefaultCategoryIcon;
    const name = catName(cat, lang);
    const description =
      cat.description?.[lang] ?? (lang === 'ar' ? getDefaultDescription(cat) : '');
    const count = childrenOf(cat.id, categories).length;
    const imageSources = cat.image ? getCategoryImageSources(cat.image) : null;

    if (isSubcategoryView) {
      const circleInner = (
        <>
          {imageSources ? (
            <CategoryCircleImage
              src={imageSources.src}
              srcSet={imageSources.srcSet}
              sizes="(min-width: 768px) 198px, 156px"
              alt={name}
            />
          ) : (
            <span className={styles.circleMedia}>
              <span className={styles.circleFallback}>
                <Icon size={54} />
              </span>
            </span>
          )}
          <span className={styles.circleLabel}>{name}</span>
        </>
      );

      return isLeaf ? (
        <Link key={cat.id} to={`/categories/${cat.id}`} className={styles.circleCard}>
          {circleInner}
        </Link>
      ) : (
        <button key={cat.id} className={styles.circleCard} onClick={() => drillInto(cat)}>
          {circleInner}
        </button>
      );
    }

    const cardInner = (
      <>
        <span className={styles.cardImageWrap}>
          {imageSources ? (
            <img
              src={imageSources.src}
              srcSet={imageSources.srcSet}
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 50vw"
              alt={name}
              className={styles.cardImage}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={styles.cardImageFallback}>
              <Icon size={48} />
            </span>
          )}
          <span className={styles.cardImageOverlay} aria-hidden="true" />
        </span>
        <span className={styles.cardBody}>
          <span className={styles.cardName}>{name}</span>
          {description && <span className={styles.cardDescription}>{description}</span>}
        </span>
        {!isLeaf && count > 0 && (
          <span className={styles.cardFooter}>
            <span className={styles.badge}>{count}</span>
            <Chevron size={14} className={styles.cardChevron} />
          </span>
        )}
      </>
    );

    return isLeaf ? (
      <Link key={cat.id} to={`/categories/${cat.id}`} className={styles.card}>
        {cardInner}
      </Link>
    ) : (
      <button key={cat.id} className={styles.card} onClick={() => drillInto(cat)}>
        {cardInner}
      </button>
    );
  };

  return (
    <div className="container">
      <div className={styles.page}>
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumb} aria-label="navigation">
            <button className={styles.crumb} onClick={goToRoot}>
              <Home size={14} />
              <span>{t('categories.title')}</span>
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className={styles.crumbSep}>
                <Chevron size={12} />
                {i < breadcrumbs.length - 1 ? (
                  <button className={styles.crumb} onClick={() => goToLevel(i)}>
                    {catName(crumb, lang)}
                  </button>
                ) : (
                  <span className={styles.crumbActive}>{catName(crumb, lang)}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className={styles.titleBar}>
          <h1 className={styles.title}>{currentTitle}</h1>
          {currentItems.length > 0 && (
            <span className={styles.count}>{currentItems.length}</span>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : currentItems.length > 0 ? (
          <div className={isSubcategoryView ? styles.circleGrid : styles.cardGrid}>
            {currentItems.map(renderCategoryItem)}
          </div>
        ) : (
          <div className={styles.empty}>
            <DefaultCategoryIcon size={40} />
            <p>{t('categories.empty', 'لا توجد تصنيفات')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
