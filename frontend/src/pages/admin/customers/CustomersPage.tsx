import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Trash2, Pencil, X, Check, FileText, StickyNote } from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import { AreaSelect, EMPTY_AREA } from '../../../shared/ui/AreaSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import type { AreaValue } from '../../../shared/ui/AreaSelect';
import type { ApiCustomer } from '../../../shared/api/types';
import styles from './CustomersPage.module.css';

interface CustomerForm {
  name: string;
  phone: string;
  area: AreaValue;
  address: string;
  notes: string;
  tech1: TechnicianValue;
  tech2: TechnicianValue;
  tech3: TechnicianValue;
}

const EMPTY_FORM: CustomerForm = {
  name: '',
  phone: '',
  area: { ...EMPTY_AREA },
  address: '',
  notes: '',
  tech1: { ...EMPTY_TECHNICIAN },
  tech2: { ...EMPTY_TECHNICIAN },
  tech3: { ...EMPTY_TECHNICIAN },
};

const getAreaDisplay = (customer: ApiCustomer) => {
  const area = customer.area;
  if (area && typeof area === 'object' && 'name' in area) return area.name;
  return '—';
};

const getTechDisplay = (customer: ApiCustomer, field: 'technician1' | 'technician2' | 'technician3') => {
  const nameField = `${field}Name` as const;
  const tech = customer[field];
  const manualName = customer[nameField];
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

const formToPayload = (form: CustomerForm) => ({
  name: form.name,
  phone: form.phone,
  area: form.area.id || undefined,
  address: form.address,
  notes: form.notes,
  technician1: pickTechId(form.tech1),
  technician1Name: pickTechName(form.tech1),
  technician2: pickTechId(form.tech2),
  technician2Name: pickTechName(form.tech2),
  technician3: pickTechId(form.tech3),
  technician3Name: pickTechName(form.tech3),
});

const customerToForm = (c: ApiCustomer): CustomerForm => {
  const techValue = (tech: unknown, name: string): TechnicianValue => {
    if (tech && typeof tech === 'object' && '_id' in tech && 'name' in tech) {
      return { id: (tech as { _id: string })._id, name: (tech as { name: string }).name, mode: 'select' };
    }
    if (name) return { id: undefined, name, mode: 'manual' };
    return { ...EMPTY_TECHNICIAN };
  };

  let areaValue: AreaValue = { ...EMPTY_AREA };
  if (c.area && typeof c.area === 'object' && '_id' in c.area && 'name' in c.area) {
    areaValue = { id: (c.area as { _id: string })._id, name: (c.area as { name: string }).name };
  }

  return {
    name: c.name,
    phone: c.phone,
    area: areaValue,
    address: c.address || '',
    notes: c.notes || '',
    tech1: techValue(c.technician1, c.technician1Name),
    tech2: techValue(c.technician2, c.technician2Name),
    tech3: techValue(c.technician3, c.technician3Name),
  };
};

export default function CustomersPage() {
  const {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
  } = useServiceOrdersStore();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CustomerForm>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(search || undefined), 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) return;
    setSaving(true);
    try {
      await createCustomer(formToPayload(addForm));
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
    } catch { /* store handles error */ } finally {
      setSaving(false);
    }
  }, [addForm, createCustomer]);

  const startEdit = useCallback((c: ApiCustomer) => {
    setEditId(c._id);
    setEditForm(customerToForm(c));
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateCustomer(editId, formToPayload(editForm));
      setEditId(null);
    } catch { /* store handles error */ } finally {
      setSaving(false);
    }
  }, [editId, editForm, updateCustomer]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الزبون "${name}"؟`)) return;
    try { await deleteCustomer(id); } catch { /* store handles error */ }
  }, [deleteCustomer]);

  const cancelForm = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setAddForm({ ...EMPTY_FORM });
    setEditForm({ ...EMPTY_FORM });
  }, []);

  if (loading && customers.length === 0) {
    return <div className={styles.page}><LoadingSpinner /></div>;
  }

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}><Users size={24} />إدارة الزبائن</h1>
          <p className={styles.pageSubtitle}>إدارة بيانات الزبائن والفنيين المخصصين</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY_FORM }); setShowAdd(!showAdd); }}>
            <Plus size={18} />زبون جديد
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل زبون</> : <><Plus size={18} />إضافة زبون جديد</>}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الزبون *</label>
              <input
                className={styles.formInput}
                placeholder="اسم الزبون"
                value={activeForm.name}
                onChange={e => setActiveForm({ ...activeForm, name: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>رقم الهاتف *</label>
              <input
                className={styles.formInput}
                placeholder="رقم الهاتف"
                value={activeForm.phone}
                onChange={e => setActiveForm({ ...activeForm, phone: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>المنطقة</label>
              <AreaSelect
                value={activeForm.area}
                onChange={area => setActiveForm({ ...activeForm, area })}
                placeholder="اختر المنطقة"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>العنوان التفصيلي</label>
              <input
                className={styles.formInput}
                placeholder="العنوان التفصيلي"
                value={activeForm.address}
                onChange={e => setActiveForm({ ...activeForm, address: e.target.value })}
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
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}><StickyNote size={14} /> ملاحظات</label>
              <textarea
                className={styles.formTextarea}
                placeholder="أضف ملاحظات عن الزبون..."
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
              <th>الهاتف</th>
              <th>المنطقة</th>
              <th>فني 1</th>
              <th>فني 2</th>
              <th>فني 3</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id}>
                <td><span className={styles.customId}>{c.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{c.phone}</td>
                <td>{getAreaDisplay(c)}</td>
                <td>{getTechDisplay(c, 'technician1')}</td>
                <td>{getTechDisplay(c, 'technician2')}</td>
                <td>{getTechDisplay(c, 'technician3')}</td>
                <td>
                  <span className={`${styles.badge} ${c.isActive ? styles.badgeGreen : styles.badgeGray}`}>
                    {c.isActive ? 'فعال' : 'غير فعال'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => startEdit(c)} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDelete(c._id, c.name)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className={styles.emptyState}>
                    <FileText size={40} />
                    <p>لا يوجد زبائن بعد</p>
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
