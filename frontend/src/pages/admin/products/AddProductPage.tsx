import { useState, useRef, useCallback, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Trash2,
  X,
  Star,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCategories } from '../../../shared/hooks/useCategories';
import { productsService } from '../../../shared/api/services';
import { invalidateProductsCache } from '../../../shared/hooks/useProducts';
import { validateImageFile } from '../../../shared/services/cloudinary';
import styles from './AddProduct.module.css';

/* ===== Types ===== */
interface SpecRow {
  id: string;
  key: string;
  value: string;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  error: string | null;
  isCover: boolean;
}

const MAX_IMAGES = 10;

/** Generate unique ID */
const uid = () => Math.random().toString(36).substring(2, 10);

export default function AddProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories } = useCategories();

  // ── Form State ──
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);

  // ── UI State ──
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ══════════════════════════════════
  //  CATEGORY MULTI-SELECT
  // ══════════════════════════════════
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  // Close dropdown on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
      setCategoryDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // ══════════════════════════════════
  //  SPECIFICATIONS (Key-Value)
  // ══════════════════════════════════
  const addSpec = () => {
    setSpecs((prev) => [...prev, { id: uid(), key: '', value: '' }]);
  };

  const updateSpec = (id: string, field: 'key' | 'value', val: string) => {
    setSpecs((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const removeSpec = (id: string) => {
    setSpecs((prev) => prev.filter((s) => s.id !== id));
  };

  // ══════════════════════════════════
  //  IMAGE HANDLING
  // ══════════════════════════════════
  const handleFilesSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;

      const newFiles = Array.from(files).slice(0, remaining);
      const newItems: ImageItem[] = [];

      for (const file of newFiles) {
        const error = validateImageFile(file);
        newItems.push({
          id: uid(),
          file,
          preview: URL.createObjectURL(file),
          error,
          isCover: images.length === 0 && newItems.length === 0, // First image is cover
        });
      }

      setImages((prev) => [...prev, ...newItems]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images.length],
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If removed image was cover, make first remaining image the cover
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const setCoverImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isCover: img.id === id })),
    );
  };

  /** Upload a single image — NOT NEEDED: backend handles Cloudinary */
  // Images are sent as raw files via FormData to POST /products

  // ══════════════════════════════════
  //  FORM SUBMIT
  // ══════════════════════════════════
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);
    setSubmitting(true);

    try {
      // 1. Collect valid image files
      const validFiles = images
        .filter((img) => img.file && !img.error)
        .map((img) => img.file);

      if (validFiles.length === 0) {
        setSubmitResult({ ok: false, msg: 'يجب إضافة صورة واحدة على الأقل' });
        setSubmitting(false);
        return;
      }

      // 2. Build specifications object
      const specificationsObj: Record<string, string> = {};
      for (const spec of specs) {
        if (spec.key.trim()) {
          specificationsObj[spec.key.trim()] = spec.value.trim();
        }
      }

      // 3. Send to backend via API — backend handles Cloudinary upload
      await productsService.create({
        name: name.trim(),
        model: model.trim(),
        price: price ? parseFloat(price) : 0,
        categories: categoryIds,
        specifications: Object.keys(specificationsObj).length > 0 ? specificationsObj : undefined,
        images: validFiles,
      });

      // 4. Invalidate cache
      invalidateProductsCache();

      setSubmitResult({ ok: true, msg: 'تم إنشاء المنتج بنجاح!' });

      // Reset form
      setName('');
      setModel('');
      setPrice('');
      setCategoryIds([]);
      setSpecs([]);
      setImages([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
      setSubmitResult({ ok: false, msg: message });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = images.filter((img) => !img.error).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/admin/products')}
        >
          <ArrowRight size={18} />
          العودة للمنتجات
        </button>
        <h1 className={styles.pageTitle}>إضافة منتج جديد</h1>
        <p className={styles.pageSubtitle}>أدخل بيانات المنتج والمواصفات والصور</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formLayout}>
          {/* ═════ Left Column: Main Info ═════ */}
          <div className={styles.mainCol}>
            {/* Basic Info Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>المعلومات الأساسية</h2>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="name">
                  اسم المنتج <span className={styles.required}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  placeholder="مثال: فرن غاز صناعي 6 عيون"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="model">
                    الموديل <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="model"
                    type="text"
                    className={styles.input}
                    placeholder="مثال: OV-6000X"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="price">
                    السعر
                  </label>
                  <input
                    id="price"
                    type="number"
                    className={styles.input}
                    placeholder="اتركه فارغاً إذا بدون سعر"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  التصنيفات <span className={styles.required}>*</span>
                </label>
                <div className={styles.multiSelect} ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className={styles.multiSelectTrigger}
                    onClick={() => setCategoryDropdownOpen((o) => !o)}
                  >
                    {categoryIds.length > 0 ? (
                      <span className={styles.selectedTags}>
                        {categoryIds.map((id) => {
                          const cat = categories.find((c) => c.id === id);
                          return (
                            <span key={id} className={styles.selectedTag}>
                              {cat?.name.ar || id}
                              <span
                                className={styles.tagRemove}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(id);
                                }}
                              >
                                <X size={12} />
                              </span>
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      <span className={styles.multiSelectPlaceholder}>اختر التصنيفات...</span>
                    )}
                  </button>

                  {categoryDropdownOpen && (
                    <div className={styles.multiSelectDropdown}>
                      {categories
                        .sort((a, b) => a.level - b.level || a.name.ar.localeCompare(b.name.ar))
                        .map((cat) => (
                          <label key={cat.id} className={styles.multiSelectOption}>
                            <input
                              type="checkbox"
                              checked={categoryIds.includes(cat.id)}
                              onChange={() => toggleCategory(cat.id)}
                            />
                            <span className={styles.optionLabel}>
                              {'─'.repeat(cat.level)} {cat.name.ar}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
                {/* Hidden required input for native form validation */}
                <input
                  type="text"
                  required
                  value={categoryIds.join(',')}
                  onChange={() => {}}
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* ═════ Specifications Card ═════ */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>المواصفات</h2>
                <button
                  type="button"
                  className={styles.addSpecBtn}
                  onClick={addSpec}
                >
                  <Plus size={16} />
                  إضافة مواصفة
                </button>
              </div>

              {specs.length === 0 ? (
                <div className={styles.emptySpecs}>
                  <p>لم تُضف أي مواصفات بعد</p>
                  <span>اضغط "إضافة مواصفة" لإضافة مواصفات مثل: الأبعاد، الوزن، الطاقة...</span>
                </div>
              ) : (
                <div className={styles.specsList}>
                  <div className={styles.specsHeader}>
                    <span>المفتاح (Key)</span>
                    <span>القيمة (Value)</span>
                    <span></span>
                  </div>
                  {specs.map((spec, index) => (
                    <div key={spec.id} className={styles.specRow}>
                      <input
                        type="text"
                        className={styles.specInput}
                        placeholder={`مثال: ${['الأبعاد', 'الوزن', 'الطاقة', 'المادة', 'الضمان'][index % 5]}`}
                        value={spec.key}
                        onChange={(e) => updateSpec(spec.id, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        className={styles.specInput}
                        placeholder={`مثال: ${['120×60×90 سم', '85 كجم', '220V / 50Hz', 'ستانلس ستيل', 'سنتين'][index % 5]}`}
                        value={spec.value}
                        onChange={(e) => updateSpec(spec.id, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.removeSpecBtn}
                        onClick={() => removeSpec(spec.id)}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═════ Images Card ═════ */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>صور المنتج</h2>
                  <p className={styles.cardHint}>
                    حد أقصى {MAX_IMAGES} صور • JPG, PNG, WebP • حد أقصى 5MB لكل صورة
                  </p>
                </div>
                <span className={styles.imageCount}>
                  {images.length}/{MAX_IMAGES}
                </span>
              </div>

              {/* Upload Area */}
              <div
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add(styles.uploadAreaDrag);
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(styles.uploadAreaDrag);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(styles.uploadAreaDrag);
                  if (e.dataTransfer.files.length > 0) {
                    const input = fileInputRef.current;
                    if (input) {
                      // Create a DataTransfer to set files
                      const dt = new DataTransfer();
                      Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
                      input.files = dt.files;
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className={styles.fileInput}
                  onChange={handleFilesSelected}
                  disabled={images.length >= MAX_IMAGES}
                />
                <ImagePlus size={36} className={styles.uploadIcon} />
                <p className={styles.uploadText}>
                  اسحب الصور هنا أو <span>اضغط للاختيار</span>
                </p>
                <p className={styles.uploadHint}>
                  {images.length >= MAX_IMAGES
                    ? 'تم الوصول للحد الأقصى من الصور'
                    : `يمكنك إضافة ${MAX_IMAGES - images.length} صور أخرى`}
                </p>
              </div>

              {/* Images Grid */}
              {images.length > 0 && (
                <>
                  <div className={styles.imagesGrid}>
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className={`${styles.imageCard} ${img.isCover ? styles.imageCardCover : ''} ${img.error ? styles.imageCardError : ''}`}
                      >
                        <div className={styles.imagePreview}>
                          <img src={img.preview} alt="" />

                          {/* Error badge */}
                          {img.error && (
                            <div className={styles.imageError}>
                              <AlertCircle size={16} />
                              <span>{img.error}</span>
                            </div>
                          )}

                          {/* Cover badge */}
                          {img.isCover && (
                            <div className={styles.coverBadge}>
                              <Star size={12} />
                              صورة رئيسية
                            </div>
                          )}
                        </div>

                        <div className={styles.imageActions}>
                          {!img.isCover && (
                            <button
                              type="button"
                              className={styles.setCoverBtn}
                              onClick={() => setCoverImage(img.id)}
                              title="تعيين كصورة رئيسية"
                            >
                              <Star size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.removeImgBtn}
                            onClick={() => removeImage(img.id)}
                            title="حذف"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {validCount > 0 && (
                    <p className={styles.uploadStatus}>
                      <CheckCircle2 size={16} />
                      {validCount} صور جاهزة للرفع — سيتم رفعها تلقائياً عند حفظ المنتج
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═════ Right Column: Sidebar ═════ */}
          <div className={styles.sideCol}>
            {/* Status Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>الحالة</h2>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleLabel}>
                  <span>المنتج فعّال (ظاهر في الموقع)</span>
                  <div
                    className={`${styles.toggle} ${isActive ? styles.toggleActive : ''}`}
                    onClick={() => setIsActive(!isActive)}
                  >
                    <div className={styles.toggleThumb} />
                  </div>
                </label>
              </div>
            </div>

            {/* Summary Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>ملخص</h2>
              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <span>الاسم</span>
                  <strong>{name || '—'}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>الموديل</span>
                  <strong>{model || '—'}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>السعر</span>
                  <strong>{price ? `${parseFloat(price).toLocaleString()} ₪` : 'بدون سعر'}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>التصنيفات</span>
                  <strong>
                    {categoryIds.length > 0
                      ? categoryIds
                          .map((id) => categories.find((c) => c.id === id)?.name.ar)
                          .filter(Boolean)
                          .join('، ')
                      : '—'}
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>المواصفات</span>
                  <strong>{specs.filter((s) => s.key.trim()).length} مواصفة</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>الصور</span>
                  <strong>{images.length} صورة ({validCount} جاهزة)</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>الحالة</span>
                  <strong className={isActive ? styles.statusActive : styles.statusInactive}>
                    {isActive ? 'فعّال' : 'مخفي'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  حفظ المنتج
                </>
              )}
            </button>

            {/* Result Message */}
            {submitResult && (
              <div
                className={`${styles.resultMsg} ${submitResult.ok ? styles.resultSuccess : styles.resultError}`}
              >
                {submitResult.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{submitResult.msg}</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
