import { useEffect, useState, useCallback } from 'react';
import { Hammer, Plus, Search, Trash2, Pencil, X, Check, FileText, StickyNote } from 'lucide-react';
import { useToolsStore } from '../../../shared/store/toolsStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import type { ApiTool } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface ToolForm {
  name: string;
  quantity: string;
  technician: TechnicianValue;
  location: string;
  notes: string;
}

const EMPTY_FORM: ToolForm = {
  name: '',
  quantity: '',
  technician: { ...EMPTY_TECHNICIAN },
  location: '',
  notes: '',
};

const getTechDisplay = (tool: ApiTool) => {
  const tech = tool.responsibleTechnician;
  const manualName = tool.responsibleTechnicianName;
  if (tech && typeof tech === 'object' && 'name' in tech) return tech.name;
  if (manualName) return manualName;
  return '—';
};

const pickTechName = (tech: TechnicianValue) => {
  const name = tech.name.trim();
  if (!name) return '';
  return tech.mode === 'manual' || !tech.id ? name : '';
};

const pickTechId = (tech: TechnicianValue) => {
  if (tech.mode === 'select' && tech.id) return tech.id;
  if (tech.mode === 'manual' && tech.name.trim()) return null;
  return undefined;
};

const formToPayload = (form: ToolForm) => ({
  name: form.name,
  quantity: Number(form.quantity) || 0,
  responsibleTechnician: pickTechId(form.technician),
  responsibleTechnicianName: pickTechName(form.technician),
  location: form.location,
  notes: form.notes,
});

const toolToForm = (t: ApiTool): ToolForm => {
  let techValue: TechnicianValue = { ...EMPTY_TECHNICIAN };
  const tech = t.responsibleTechnician;
  if (tech && typeof tech === 'object' && '_id' in tech && 'name' in tech) {
    techValue = { id: (tech as { _id: string })._id, name: (tech as { name: string }).name, mode: 'select' };
  } else if (t.responsibleTechnicianName) {
    techValue = { id: undefined, name: t.responsibleTechnicianName, mode: 'manual' };
  }
  return {
    name: t.name,
    quantity: String(t.quantity),
    technician: techValue,
    location: t.location,
    notes: t.notes,
  };
};

export default function ToolsPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useToolsStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ToolForm>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ToolForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(search || undefined), 300);
    return () => clearTimeout(t);
  }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      await createItem(formToPayload(addForm) as unknown as Record<string, unknown>);
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
    } catch { /* store handles error */ } finally {
      setSaving(false);
    }
  }, [addForm, createItem]);

  const startEdit = useCallback((t: ApiTool) => {
    setEditId(t._id);
    setEditForm(toolToForm(t));
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateItem(editId, formToPayload(editForm) as unknown as Record<string, unknown>);
      setEditId(null);
    } catch { /* store handles error */ } finally {
      setSaving(false);
    }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try { await deleteItem(id); } catch { /* store handles error */ }
  }, [deleteItem]);

  const cancelForm = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setAddForm({ ...EMPTY_FORM });
    setEditForm({ ...EMPTY_FORM });
  }, []);

  if (loading && items.length === 0) {
    return <div className={styles.page}><LoadingSpinner /></div>;
  }

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}><Hammer size={24} />إدارة العدد</h1>
          <p className={styles.pageSubtitle}>العدد والأدوات</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY_FORM }); setShowAdd(!showAdd); }}>
            <Plus size={18} />إضافة
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل عدة</> : <><Plus size={18} />إضافة عدة جديدة</>}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الاسم *</label>
              <input
                className={styles.formInput}
                placeholder="اسم العدة"
                value={activeForm.name}
                onChange={e => setActiveForm({ ...activeForm, name: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الكمية</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="0"
                value={activeForm.quantity}
                onChange={e => setActiveForm({ ...activeForm, quantity: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفني المسؤول</label>
              <TechnicianSelect
                value={activeForm.technician}
                onChange={technician => setActiveForm({ ...activeForm, technician })}
                placeholder="اختر أو أدخل الفني"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الموقع</label>
              <input
                className={styles.formInput}
                placeholder="الموقع"
                value={activeForm.location}
                onChange={e => setActiveForm({ ...activeForm, location: e.target.value })}
              />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}><StickyNote size={14} /> ملاحظات</label>
              <textarea
                className={styles.formTextarea}
                placeholder="أضف ملاحظات..."
                value={activeForm.notes}
                onChange={e => setActiveForm({ ...activeForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving}>
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelForm}>
              <X size={14} />إلغاء
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>الرمز</th>
              <th>الاسم</th>
              <th>الكمية</th>
              <th>الفني المسؤول</th>
              <th>الموقع</th>
              <th>ملاحظات</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(t => (
              <tr key={t._id}>
                <td><span className={styles.customId}>{t.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td>{t.quantity}</td>
                <td>{getTechDisplay(t)}</td>
                <td>{t.location || '—'}</td>
                <td style={{ maxWidth: 220, fontSize: '0.85rem', color: '#6b7280' }}>{t.notes || '—'}</td>
                <td>
                  <span className={`${styles.badge} ${t.isActive ? styles.badgeGreen : styles.badgeGray}`}>
                    {t.isActive ? 'فعال' : 'غير فعال'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => startEdit(t)} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDel(t._id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <FileText size={40} />
                    <p>لا يوجد بيانات</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
