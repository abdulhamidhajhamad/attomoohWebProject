import { useEffect, useState, useCallback } from 'react';
import { Cog, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMachinesStore } from '../../../shared/store/machinesStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import type { ApiMachine } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface MachineForm {
  name: string;
  tech1: TechnicianValue;
  tech2: TechnicianValue;
  tech3: TechnicianValue;
}

const EMPTY_FORM: MachineForm = {
  name: '',
  tech1: { ...EMPTY_TECHNICIAN },
  tech2: { ...EMPTY_TECHNICIAN },
  tech3: { ...EMPTY_TECHNICIAN },
};

const getTechDisplay = (machine: ApiMachine, field: 'technician1' | 'technician2' | 'technician3') => {
  const nameField = `${field}Name` as const;
  const tech = machine[field];
  const manualName = machine[nameField];
  if (tech && typeof tech === 'object' && 'name' in tech) return tech.name;
  if (manualName) return manualName;
  return '—';
};

const formToPayload = (form: MachineForm) => ({
  name: form.name,
  technician1: form.tech1.mode === 'select' && form.tech1.id ? form.tech1.id : undefined,
  technician1Name: form.tech1.mode === 'manual' ? form.tech1.name : '',
  technician2: form.tech2.mode === 'select' && form.tech2.id ? form.tech2.id : undefined,
  technician2Name: form.tech2.mode === 'manual' ? form.tech2.name : '',
  technician3: form.tech3.mode === 'select' && form.tech3.id ? form.tech3.id : undefined,
  technician3Name: form.tech3.mode === 'manual' ? form.tech3.name : '',
});

const machineToForm = (m: ApiMachine): MachineForm => {
  const techValue = (tech: unknown, name: string): TechnicianValue => {
    if (tech && typeof tech === 'object' && '_id' in tech && 'name' in tech) {
      return { id: (tech as { _id: string })._id, name: (tech as { name: string }).name, mode: 'select' };
    }
    if (name) return { id: undefined, name, mode: 'manual' };
    return { ...EMPTY_TECHNICIAN };
  };
  return {
    name: m.name,
    tech1: techValue(m.technician1, m.technician1Name),
    tech2: techValue(m.technician2, m.technician2Name),
    tech3: techValue(m.technician3, m.technician3Name),
  };
};

export default function MachinesPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachinesStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<MachineForm>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MachineForm>({ ...EMPTY_FORM });
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

  const startEdit = useCallback((m: ApiMachine) => {
    setEditId(m._id);
    setEditForm(machineToForm(m));
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
          <h1 className={styles.pageTitle}><Cog size={24} />إدارة الآلات</h1>
          <p className={styles.pageSubtitle}>إدارة بيانات الآلات والفنيين المسؤولين</p>
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
            {isEditing ? <><Pencil size={18} />تعديل آلة</> : <><Plus size={18} />إضافة آلة جديدة</>}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الآلة *</label>
              <input
                className={styles.formInput}
                placeholder="اسم الآلة"
                value={activeForm.name}
                onChange={e => setActiveForm({ ...activeForm, name: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفني الأول</label>
              <TechnicianSelect
                value={activeForm.tech1}
                onChange={tech1 => setActiveForm({ ...activeForm, tech1 })}
                placeholder="اختر أو أدخل الفني"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفني الثاني</label>
              <TechnicianSelect
                value={activeForm.tech2}
                onChange={tech2 => setActiveForm({ ...activeForm, tech2 })}
                placeholder="اختر أو أدخل الفني"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفني الثالث</label>
              <TechnicianSelect
                value={activeForm.tech3}
                onChange={tech3 => setActiveForm({ ...activeForm, tech3 })}
                placeholder="اختر أو أدخل الفني"
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
              <th>فني 1</th>
              <th>فني 2</th>
              <th>فني 3</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m._id}>
                <td><span className={styles.customId}>{m.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td>{getTechDisplay(m, 'technician1')}</td>
                <td>{getTechDisplay(m, 'technician2')}</td>
                <td>{getTechDisplay(m, 'technician3')}</td>
                <td>
                  <span className={`${styles.badge} ${m.isActive ? styles.badgeGreen : styles.badgeGray}`}>
                    {m.isActive ? 'فعال' : 'غير فعال'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => startEdit(m)} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDel(m._id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7}>
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
