import { useState, useMemo, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, X } from 'lucide-react';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { FormCard } from '../../../shared/ui/FormCard';
import { ToggleSwitch } from '../../../shared/ui/ToggleSwitch';
import { ResultMessage } from '../../../shared/ui/ResultMessage';
import { SubmitButton } from '../../../shared/ui/SubmitButton';
import { useCategories } from '../../../shared/hooks/useCategories';
import formStyles from '../../../shared/ui/AdminForm/AdminForm.module.css';

/* ═══════════════════════════════════
   Constants
   ═══════════════════════════════════ */

const LEVEL_LABELS = ['تصنيف رئيسي (مستوى 0)', 'تصنيف فرعي (مستوى 1)', 'تصنيف فرعي ثاني (مستوى 2)'];

/* ═══════════════════════════════════
   Types
   ═══════════════════════════════════ */

interface SubmitResult {
  ok: boolean;
  msg: string;
}

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

export default function AddCategoryPage() {
  const [searchParams] = useSearchParams();
  const preselectedParent = searchParams.get('parent') || '';

  const { categories } = useCategories();

  // ── Form State ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentIds, setParentIds] = useState<string[]>(preselectedParent ? [preselectedParent] : []);
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

  // Resolve selected parents for summary display
  const selectedParents = useMemo(
    () => categories.filter((c) => parentIds.includes(c.id)),
    [categories, parentIds],
  );

  // Calculate level from max parent level
  const calculatedLevel = useMemo(() => {
    if (selectedParents.length === 0) return 0;
    const maxLevel = Math.max(...selectedParents.map((p) => p.level));
    return maxLevel + 1;
  }, [selectedParents]);

  // Build parent options (only categories with level < 2)
  const parentOptions = useMemo(() => {
    return categories
      .filter((c) => c.level < 2)
      .sort((a, b) => a.level - b.level || a.name.ar.localeCompare(b.name.ar));
  }, [categories]);

  const toggleParent = useCallback((id: string) => {
    setParentIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }, []);

  const removeParent = useCallback((id: string) => {
    setParentIds((prev) => prev.filter((pid) => pid !== id));
  }, []);

  // ═════ FORM SUBMIT ═════

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);
    setSubmitting(true);

    try {
      const { categoriesService } = await import('../../../shared/api/services');
      await categoriesService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        parentIds: parentIds.length > 0 ? parentIds : undefined,
        isActive,
      });

      const { invalidateCategoriesCache } = await import(
        '../../../shared/hooks/useCategories'
      );
      invalidateCategoriesCache();

      setSubmitResult({ ok: true, msg: 'تم إنشاء التصنيف بنجاح!' });

      // Reset form
      setName('');
      setDescription('');
      setParentIds([]);
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
            </FormCard>

            {/* Hierarchy Card */}
            <FormCard title="الموقع في الشجرة">
              <div className={formStyles.inputGroup}>
                <label className={formStyles.label}>
                  التصنيفات الأب
                </label>

                {/* Selected parents chips */}
                {parentIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {selectedParents.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          background: '#90297d15',
                          color: '#90297d',
                          borderRadius: 8,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {'─'.repeat(p.level + 1)} {p.name.ar}
                        <button
                          type="button"
                          onClick={() => removeParent(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: '#90297d',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown toggle */}
                <div ref={parentDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={formStyles.input}
                    onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'right',
                      width: '100%',
                    }}
                  >
                    <span style={{ color: parentIds.length === 0 ? '#9ca3af' : undefined }}>
                      {parentIds.length === 0
                        ? '— تصنيف رئيسي (بدون أب) —'
                        : `تم اختيار ${parentIds.length} تصنيف`}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{
                        transition: 'transform 0.2s',
                        transform: parentDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Dropdown list */}
                  {parentDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 50,
                        maxHeight: 250,
                        overflowY: 'auto',
                        marginTop: 4,
                      }}
                    >
                      {parentOptions.map((cat) => {
                        const isChecked = parentIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              background: isChecked ? '#90297d08' : 'transparent',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isChecked) e.currentTarget.style.background = '#f9fafb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isChecked ? '#90297d08' : 'transparent';
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleParent(cat.id)}
                              style={{ accentColor: '#90297d', width: 16, height: 16 }}
                            />
                            <span style={{ fontSize: '0.88rem', fontWeight: isChecked ? 600 : 400 }}>
                              {'─'.repeat(cat.level + 1)} {cat.name.ar}
                            </span>
                          </label>
                        );
                      })}
                      {parentOptions.length === 0 && (
                        <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                          لا توجد تصنيفات متاحة
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <small style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  اتركه فارغاً لإنشاء تصنيف رئيسي (جذر). أو اختر تصنيفاً أو أكثر ليكون هذا فرعياً منها.
                </small>
              </div>

              {/* Level indicator */}
              <div
                style={{
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  color: '#374151',
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                المستوى: {LEVEL_LABELS[calculatedLevel] ?? `مستوى ${calculatedLevel}`}
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
                    {selectedParents.length > 0
                      ? selectedParents.map((p) => p.name.ar).join('، ')
                      : 'بدون (رئيسي)'}
                  </strong>
                </div>
                <div className={formStyles.summaryItem}>
                  <span>المستوى</span>
                  <strong>{calculatedLevel}</strong>
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
