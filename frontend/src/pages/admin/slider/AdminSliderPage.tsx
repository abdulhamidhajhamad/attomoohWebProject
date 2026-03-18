import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import {
  ImagePlus, Loader2, ChevronUp, ChevronDown,
  Eye, EyeOff, Trash2, Image as ImageIcon,
} from 'lucide-react';
import { uploadToCloudinary, validateImageFile } from '../../../shared/services/cloudinary';
import { useSliderStore, type SliderImage } from '../../../shared/store/sliderStore';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { FormCard } from '../../../shared/ui/FormCard';
import { ResultMessage } from '../../../shared/ui/ResultMessage';
import formStyles from '../../../shared/ui/AdminForm/AdminForm.module.css';
import styles from './AdminSlider.module.css';

/* ═══════════════════════════════════
   Constants
   ═══════════════════════════════════ */
const MAX_SLIDES = 7;

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

/**
 * AdminSliderPage — Manage hero slider images.
 *
 * Features:
 * - Upload up to 7 images (Cloudinary)
 * - Preview images
 * - Delete individual images
 * - Reorder (move up / down)
 * - Toggle active / hidden
 * - Drag & drop upload
 * - Persisted via Zustand (localStorage) — later via API
 */
export default function AdminSliderPage() {
  const slides = useSliderStore((s) => s.slides);
  const addSlide = useSliderStore((s) => s.addSlide);
  const removeSlide = useSliderStore((s) => s.removeSlide);
  const toggleSlide = useSliderStore((s) => s.toggleSlide);
  const moveUp = useSliderStore((s) => s.moveUp);
  const moveDown = useSliderStore((s) => s.moveDown);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canUpload = slides.length < MAX_SLIDES && !uploading;

  // ══════════════════════════════════
  //  UPLOAD HANDLER
  // ══════════════════════════════════

  const handleFileSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Validate
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        setTimeout(() => setError(null), 4000);
        return;
      }

      if (slides.length >= MAX_SLIDES) {
        setError(`الحد الأقصى ${MAX_SLIDES} صور للسلايدر`);
        setTimeout(() => setError(null), 4000);
        return;
      }

      setError(null);
      setSuccess(null);
      setUploading(true);
      setUploadProgress(0);

      try {
        const result = await uploadToCloudinary(file, 'attomooh/slider', (progress) => {
          setUploadProgress(progress.percent);
        });

        addSlide({
          publicId: result.publicId,
          secureUrl: result.secureUrl,
          isActive: true,
        });

        setSuccess('تم رفع الصورة بنجاح!');
        setTimeout(() => setSuccess(null), 3000);
      } catch {
        setError('فشل رفع الصورة، حاول مرة أخرى');
        setTimeout(() => setError(null), 4000);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [slides.length, addSlide],
  );

  // ══════════════════════════════════
  //  DELETE HANDLER
  // ══════════════════════════════════

  const handleDelete = useCallback(
    (id: string) => {
      removeSlide(id);
      setDeleteConfirmId(null);
      setSuccess('تم حذف الصورة');
      setTimeout(() => setSuccess(null), 3000);
    },
    [removeSlide],
  );

  // ══════════════════════════════════
  //  RENDER
  // ══════════════════════════════════

  return (
    <div className={formStyles.page}>
      {/* ═════ Header ═════ */}
      <PageHeader
        title="إدارة السلايدر"
        subtitle={`${slides.length} من ${MAX_SLIDES} صور مرفوعة`}
        backTo="/admin"
        backLabel="لوحة التحكم"
      />

      {/* Messages */}
      {error && <ResultMessage ok={false} message={error} />}
      {success && <ResultMessage ok={true} message={success} />}

      <div className={styles.layout}>
        {/* ═════ Slides List ═════ */}
        <div className={styles.mainCol}>
          <FormCard
            title="صور السلايدر"
            headerAction={
              <span className={styles.slideCount}>
                {slides.filter((s) => s.isActive).length} فعّال من {slides.length}
              </span>
            }
          >
            {slides.length === 0 ? (
              <div className={styles.emptyState}>
                <ImageIcon size={48} strokeWidth={1.5} />
                <p>لا توجد صور في السلايدر</p>
                <span>ارفع صور لعرضها في الصفحة الرئيسية</span>
              </div>
            ) : (
              <div className={styles.slidesList}>
                {slides.map((slide, index) => (
                  <SlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    total={slides.length}
                    onMoveUp={() => moveUp(slide.id)}
                    onMoveDown={() => moveDown(slide.id)}
                    onToggle={() => toggleSlide(slide.id)}
                    onDeleteRequest={() => setDeleteConfirmId(slide.id)}
                    isDeleting={deleteConfirmId === slide.id}
                    onDeleteConfirm={() => handleDelete(slide.id)}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                  />
                ))}
              </div>
            )}
          </FormCard>
        </div>

        {/* ═════ Sidebar — Upload ═════ */}
        <div className={styles.sideCol}>
          <FormCard title="رفع صورة جديدة" hint={`JPG, PNG, WebP • حد أقصى ${MAX_SLIDES} صور`}>
            {/* Upload Area */}
            <div
              className={`${styles.uploadArea} ${!canUpload ? styles.uploadDisabled : ''}`}
              onClick={() => canUpload && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (canUpload) e.currentTarget.classList.add(styles.uploadDrag);
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(styles.uploadDrag);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(styles.uploadDrag);
                if (!canUpload || e.dataTransfer.files.length === 0) return;
                const dt = new DataTransfer();
                dt.items.add(e.dataTransfer.files[0]);
                const input = fileInputRef.current;
                if (input) {
                  input.files = dt.files;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
            >
              {uploading ? (
                <div className={styles.uploadingState}>
                  <Loader2 size={32} className={styles.spinner} />
                  <span className={styles.uploadPercent}>{uploadProgress}%</span>
                  <p>جاري رفع الصورة...</p>
                </div>
              ) : (
                <>
                  <ImagePlus size={36} className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    {canUpload
                      ? <>اسحب الصورة هنا أو <span>اضغط للاختيار</span></>
                      : slides.length >= MAX_SLIDES
                        ? 'وصلت للحد الأقصى من الصور'
                        : 'جاري الرفع...'}
                  </p>
                  <p className={styles.uploadHint}>
                    أبعاد مثالية: 1280×400 بكسل
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
          </FormCard>

          {/* Tips */}
          <FormCard title="نصائح">
            <ul className={styles.tipsList}>
              <li>يمكنك رفع حتى <strong>{MAX_SLIDES} صور</strong> للسلايدر</li>
              <li>استخدم صور بعرض <strong>1280px</strong> وارتفاع <strong>400px</strong> للأفضل</li>
              <li>رتّب الصور بالأسهم ↑↓</li>
              <li>أخفِ أي صورة بزر العين بدون حذفها</li>
              <li>السلايد التعريفي الأول يظهر دائماً تلقائياً</li>
            </ul>
          </FormCard>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   SlideCard — Individual slide row
   ═══════════════════════════════════ */

interface SlideCardProps {
  slide: SliderImage;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onDeleteRequest: () => void;
  isDeleting: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function SlideCard({
  slide,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDeleteRequest,
  isDeleting,
  onDeleteConfirm,
  onDeleteCancel,
}: SlideCardProps) {
  return (
    <div className={`${styles.slideCard} ${!slide.isActive ? styles.slideInactive : ''}`}>
      {/* Thumbnail */}
      <div className={styles.slideThumbnail}>
        <img src={slide.secureUrl} alt={slide.title || `Slide ${index + 1}`} />
        {!slide.isActive && <div className={styles.inactiveOverlay}>مخفي</div>}
      </div>

      {/* Info */}
      <div className={styles.slideInfo}>
        <span className={styles.slideOrder}>#{index + 1}</span>
        <span className={styles.slideTitle}>{slide.title || `سلايد ${index + 1}`}</span>
      </div>

      {/* Actions */}
      <div className={styles.slideActions}>
        {/* Reorder */}
        <button
          className={styles.actionBtn}
          onClick={onMoveUp}
          disabled={index === 0}
          title="نقل للأعلى"
        >
          <ChevronUp size={18} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="نقل للأسفل"
        >
          <ChevronDown size={18} />
        </button>

        {/* Toggle active */}
        <button
          className={`${styles.actionBtn} ${slide.isActive ? styles.activeBtn : styles.hiddenBtn}`}
          onClick={onToggle}
          title={slide.isActive ? 'إخفاء' : 'إظهار'}
        >
          {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        {/* Delete */}
        {isDeleting ? (
          <div className={styles.deleteConfirm}>
            <button className={styles.confirmYes} onClick={onDeleteConfirm} title="تأكيد الحذف">
              نعم
            </button>
            <button className={styles.confirmNo} onClick={onDeleteCancel} title="إلغاء">
              لا
            </button>
          </div>
        ) : (
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={onDeleteRequest}
            title="حذف"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
