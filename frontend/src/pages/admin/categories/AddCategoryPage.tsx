import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Sparkles, Layers3 } from 'lucide-react';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { FormCard } from '../../../shared/ui/FormCard';
import { ToggleSwitch } from '../../../shared/ui/ToggleSwitch';
import { ResultMessage } from '../../../shared/ui/ResultMessage';
import { SubmitButton } from '../../../shared/ui/SubmitButton';
import {
  useCategories,
  invalidateCategoriesCache,
} from '../../../shared/hooks/useCategories';
import { categoriesService } from '../../../shared/api/services';
import type { Category } from '../../../shared/types';
import formStyles from '../../../shared/ui/AdminForm/AdminForm.module.css';
import styles from './AddCategory.module.css';

/* ═══════════════════════════════════
   Constants
   ═══════════════════════════════════ */

const LEVEL_META = [
  {
    title: 'المستوى الأول',
    label: 'تصنيف رئيسي',
    hint: 'قطاع عام مثل معدات مطاعم أو معدات ملاحم',
  },
  {
    title: 'المستوى الثاني',
    label: 'تصنيف فرعي',
    hint: 'قسم متخصص داخل القطاع مثل معدات بار أو آلات فرم',
  },
  {
    title: 'المستوى الثالث',
    label: 'تصنيف فرعي دقيق',
    hint: 'فئة نهائية للمنتجات مثل آلات اسبريسو',
  },
];

/* ═══════════════════════════════════
   Types
   ═══════════════════════════════════ */

interface SubmitResult {
  ok: boolean;
  msg: string;
}

function revokeObjectUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function buildParentChain(
  category: Category,
  byId: Map<string, Category>,
): Category[] {
  const chain: Category[] = [];
  const visited = new Set<string>();

  let current: Category | null = category;
  while (current && !visited.has(current.id)) {
    chain.unshift(current);
    visited.add(current.id);
    const parentId = current.parentIds[0];
    current = parentId ? (byId.get(parentId) ?? null) : null;
  }

  return chain;
}

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

export default function AddCategoryPage() {
  const [searchParams] = useSearchParams();
  const preselectedParent = searchParams.get('parent') || '';

  const { categories } = useCategories();
  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );

  // ── Form State ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [parentId, setParentId] = useState<string>(preselectedParent);
  const [isActive, setIsActive] = useState(true);
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement>(null);

  // ── Submit State ──
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(e.target as Node)) {
        setParentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(imagePreview);
    };
  }, [imagePreview]);

  const selectedParent = useMemo(
    () => (parentId ? (categoriesById.get(parentId) ?? null) : null),
    [categoriesById, parentId],
  );

  useEffect(() => {
    if (!parentId) return;
    if (categories.length === 0) return;
    if (!categoriesById.has(parentId)) {
      setParentId('');
    }
  }, [parentId, categories.length, categoriesById]);

  useEffect(() => {
    if (!selectedParent) return;
    if (selectedParent.level >= 2) {
      setParentId('');
      setSubmitResult({
        ok: false,
        msg: 'لا يمكن الإضافة تحت مستوى ثالث. اختر تصنيفاً من المستوى الأول أو الثاني.',
      });
    }
  }, [selectedParent]);

  // Calculate level from selected parent
  const calculatedLevel = useMemo(() => {
    if (!selectedParent) return 0;
    return selectedParent.level + 1;
  }, [selectedParent]);

  const isSubCategory = calculatedLevel > 0;

  useEffect(() => {
    if (isSubCategory) return;

    if (imageFile) setImageFile(null);
    if (imageUrl) setImageUrl('');
    if (imagePreview) {
      revokeObjectUrl(imagePreview);
      setImagePreview('');
    }
  }, [isSubCategory, imageFile, imageUrl, imagePreview]);

  const selectedParentChain = useMemo(() => {
    if (!selectedParent) return [];
    return buildParentChain(selectedParent, categoriesById);
  }, [selectedParent, categoriesById]);

  const hierarchyPreview = useMemo(() => {
    const draftName = name.trim() || 'التصنيف الجديد';
    if (selectedParentChain.length === 0) return draftName;
    return [...selectedParentChain.map((p) => p.name.ar), draftName].join(' / ');
  }, [name, selectedParentChain]);

  // Build parent options (only categories with level < 2)
  const parentOptions = useMemo(() => {
    return categories
      .filter((c) => c.level < 2)
      .sort((a, b) => a.level - b.level || a.name.ar.localeCompare(b.name.ar));
  }, [categories]);

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (imagePreview) {
      revokeObjectUrl(imagePreview);
      setImagePreview('');
    }

    if (!file) {
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setImageUrl('');
    setImagePreview(URL.createObjectURL(file));
  };

  // ═════ FORM SUBMIT ═════

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);

    if (isSubCategory && !imageFile && !imageUrl.trim()) {
      setSubmitResult({
        ok: false,
        msg: 'صورة التصنيف الفرعي مطلوبة لعرضها بشكل دائري في صفحة التصنيفات.',
      });
      return;
    }

    setSubmitting(true);

    try {
      await categoriesService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        image: imageUrl.trim() || undefined,
        imageFile: imageFile ?? undefined,
        parentIds: parentId ? [parentId] : undefined,
        isActive,
      });

      invalidateCategoriesCache();

      setSubmitResult({ ok: true, msg: 'تم إنشاء التصنيف بنجاح!' });

      // Reset form
      setName('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      if (imagePreview) {
        revokeObjectUrl(imagePreview);
        setImagePreview('');
      }
      setIsActive(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التصنيف';
      setSubmitResult({ ok: false, msg: message });
    } finally {
      setSubmitting(false);
    }
  };

  // ═════ RENDER ═════

  return (
    <div className={formStyles.page}>
      <PageHeader
        title="إضافة تصنيف جديد"
        subtitle="أدخل بيانات التصنيف"
        backTo="/admin/categories"
        backLabel="العودة للتصنيفات"
      />

      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.formLayout}>
          {/* ═════ Main Column ═════ */}
          <div className={formStyles.mainCol}>
            {/* Basic Info Card */}
            <FormCard title="المعلومات الأساسية">
              <div className={formStyles.inputGroup}>
                <label className={formStyles.label} htmlFor="cat-name">
                  اسم التصنيف <span className={formStyles.required}>*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  className={formStyles.input}
                  placeholder="مثال: أفران صناعية"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className={formStyles.inputGroup}>
                <label className={formStyles.label} htmlFor="cat-desc">
                  الوصف
                </label>
                <textarea
                  id="cat-desc"
                  className={formStyles.textarea}
                  placeholder="وصف مختصر للتصنيف (اختياري)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {isSubCategory && (
                <div className={formStyles.inputGroup}>
                  <label className={formStyles.label} htmlFor="cat-image-file">
                    صورة التصنيف الفرعي <span className={formStyles.required}>*</span>
                  </label>

                  <input
                    id="cat-image-file"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className={formStyles.input}
                    onChange={handleImageFileChange}
                  />

                  <div className={styles.imageOrDivider}>أو</div>

                  <input
                    id="cat-image-url"
                    type="url"
                    className={formStyles.input}
                    placeholder="رابط صورة مباشر (اختياري بدل الملف)"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (e.target.value.trim() && imageFile) {
                        setImageFile(null);
                        if (imagePreview) {
                          revokeObjectUrl(imagePreview);
                          setImagePreview('');
                        }
                      }
                    }}
                  />

                  {(imagePreview || imageUrl.trim()) && (
                    <div className={styles.imagePreviewWrap}>
                      <div className={styles.imagePreviewCircle}>
                        <img
                          src={imagePreview || imageUrl.trim()}
                          alt="معاينة صورة التصنيف"
                          className={styles.imagePreview}
                        />
                      </div>
                      <span className={styles.imagePreviewLabel}>
                        معاينة شكل بطاقة التصنيف الفرعي
                      </span>
                    </div>
                  )}

                  <small className={styles.helperText}>
                    تظهر هذه الصورة بشكل دائري في عرض التصنيفات الفرعية بالموقع.
                  </small>
                </div>
              )}
            </FormCard>

            {/* Hierarchy Card */}
            <FormCard title="الموقع في الشجرة">
              <div className={styles.hierarchyGuide}>
                {LEVEL_META.map((step, index) => {
                  const state =
                    index < calculatedLevel
                      ? 'done'
                      : index === calculatedLevel
                        ? 'active'
                        : 'idle';

                  return (
                    <div
                      key={step.title}
                      className={`${styles.levelStep} ${styles[`state${state[0].toUpperCase()}${state.slice(1)}`]}`}
                    >
                      <div className={styles.stepTitle}>{step.title}</div>
                      <div className={styles.stepLabel}>{step.label}</div>
                      <p className={styles.stepHint}>{step.hint}</p>
                    </div>
                  );
                })}
              </div>

              <div className={formStyles.inputGroup}>
                <label className={formStyles.label}>
                  التصنيف الأب
                </label>

                <div ref={parentDropdownRef} className={styles.parentSelector}>
                  <button
                    type="button"
                    className={styles.parentTrigger}
                    onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                  >
                    <span className={!parentId ? styles.placeholder : styles.parentValue}>
                      {!parentId ? 'بدون أب (تصنيف رئيسي)' : selectedParent?.name.ar}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`${styles.parentChevron} ${parentDropdownOpen ? styles.parentChevronOpen : ''}`}
                    />
                  </button>

                  {parentDropdownOpen && (
                    <div className={styles.parentMenu}>
                      <button
                        type="button"
                        className={`${styles.parentOption} ${!parentId ? styles.parentOptionSelected : ''}`}
                        onClick={() => {
                          setParentId('');
                          setParentDropdownOpen(false);
                        }}
                      >
                        <span className={styles.optionTitle}>بدون أب</span>
                        <span className={styles.optionMeta}>تصنيف رئيسي</span>
                      </button>

                      {parentOptions.map((cat) => {
                        const isSelected = cat.id === parentId;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            className={`${styles.parentOption} ${isSelected ? styles.parentOptionSelected : ''}`}
                            onClick={() => {
                              setParentId(cat.id);
                              setParentDropdownOpen(false);
                            }}
                          >
                            <span className={styles.optionTitle}>
                              {cat.level === 0 ? 'قطاع' : 'قسم'}: {cat.name.ar}
                            </span>
                            <span className={styles.optionMeta}>المستوى {cat.level + 1}</span>
                          </button>
                        );
                      })}

                      {parentOptions.length === 0 && (
                        <div className={styles.parentEmpty}>
                          لا توجد تصنيفات متاحة
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <small className={styles.helperText}>
                  اختر أباً واحداً فقط. النظام يدعم 3 مستويات: رئيسي ثم فرعي ثم فرعي دقيق.
                </small>
              </div>

              <div className={styles.levelIndicator}>
                <Layers3 size={16} />
                <span>
                  سيتم إنشاء هذا التصنيف على: <strong>{LEVEL_META[calculatedLevel]?.label ?? `المستوى ${calculatedLevel + 1}`}</strong>
                </span>
              </div>

              <div className={styles.pathPreview}>
                <Sparkles size={15} />
                <span>{hierarchyPreview}</span>
              </div>
            </FormCard>
          </div>

          {/* ═════ Sidebar ═════ */}
          <div className={formStyles.sideCol}>
            {/* Status Card */}
            <FormCard title="الحالة">
              <ToggleSwitch
                checked={isActive}
                onChange={setIsActive}
                label="التصنيف فعّال (ظاهر في الموقع)"
              />
            </FormCard>

            {/* Summary Card */}
            <FormCard title="ملخص">
              <div className={formStyles.summaryList}>
                <div className={formStyles.summaryItem}>
                  <span>الاسم</span>
                  <strong>{name || '—'}</strong>
                </div>
                <div className={formStyles.summaryItem}>
                  <span>الأب</span>
                  <strong>
                    {selectedParent ? selectedParent.name.ar : 'بدون (رئيسي)'}
                  </strong>
                </div>
                <div className={formStyles.summaryItem}>
                  <span>المستوى</span>
                  <strong>{calculatedLevel + 1}</strong>
                </div>
                {isSubCategory && (
                  <div className={formStyles.summaryItem}>
                    <span>صورة الفرعي</span>
                    <strong>{imageFile || imageUrl.trim() ? 'مضافة' : 'غير مضافة'}</strong>
                  </div>
                )}
                <div className={formStyles.summaryItem}>
                  <span>المسار</span>
                  <strong>{hierarchyPreview}</strong>
                </div>
                <div className={formStyles.summaryItem}>
                  <span>الحالة</span>
                  <strong
                    className={
                      isActive
                        ? formStyles.statusActive
                        : formStyles.statusInactive
                    }
                  >
                    {isActive ? 'فعّال' : 'مخفي'}
                  </strong>
                </div>
              </div>
            </FormCard>

            {/* Submit Button */}
            <SubmitButton loading={submitting} loadingText="جاري الحفظ...">
              <CheckCircle2 size={18} />
              حفظ التصنيف
            </SubmitButton>

            {/* Result Message */}
            {submitResult && (
              <ResultMessage ok={submitResult.ok} message={submitResult.msg} />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
