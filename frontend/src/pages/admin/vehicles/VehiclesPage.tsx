import { useEffect, useState, useCallback } from 'react';
import { Car, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useVehiclesStore } from '../../../shared/store/vehiclesStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { EmployeeSelect, EMPTY_EMPLOYEE } from '../../../shared/ui/EmployeeSelect';
import type { EmployeeValue } from '../../../shared/ui/EmployeeSelect';
import type { ApiVehicle } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface VehicleForm {
  brandAndModel: string;
  plateNumber: string;
  responsible: EmployeeValue;
}
const EMPTY: VehicleForm = { brandAndModel: '', plateNumber: '', responsible: { ...EMPTY_EMPLOYEE } };

const pickResponsibleName = (res: EmployeeValue) => {
  const name = res.name.trim();
  if (!name) return '';
  return res.mode === 'manual' || !res.id ? name : '';
};

const pickResponsibleId = (res: EmployeeValue) => {
  if (res.mode === 'select' && res.id) return res.id;
  if (res.mode === 'manual' && res.name.trim()) return null;
  return undefined;
};

const formToPayload = (form: VehicleForm) => ({
  brandAndModel: form.brandAndModel,
  plateNumber: form.plateNumber,
  responsibleUser: pickResponsibleId(form.responsible),
  responsiblePerson: pickResponsibleName(form.responsible),
});

const vehicleToForm = (v: ApiVehicle): VehicleForm => {
  let responsibleValue: EmployeeValue = { ...EMPTY_EMPLOYEE };
  if (v.responsibleUser && typeof v.responsibleUser === 'object' && '_id' in v.responsibleUser && 'name' in v.responsibleUser) {
    responsibleValue = { id: v.responsibleUser._id, name: v.responsibleUser.name, mode: 'select' };
  } else if (v.responsiblePerson) {
    responsibleValue = { id: undefined, name: v.responsiblePerson, mode: 'manual' };
  }
  return {
    brandAndModel: v.brandAndModel,
    plateNumber: v.plateNumber,
    responsible: responsibleValue,
  };
};

const getResponsibleDisplay = (v: ApiVehicle) => {
  if (v.responsibleUser && typeof v.responsibleUser === 'object' && 'name' in v.responsibleUser) return v.responsibleUser.name;
  if (v.responsiblePerson) return v.responsiblePerson;
  return '—';
};

export default function VehiclesPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useVehiclesStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<VehicleForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VehicleForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.brandAndModel.trim()) return;
    setSaving(true);
    try {
      await createItem(formToPayload(addForm) as unknown as Record<string, unknown>);
      setAddForm({ ...EMPTY });
      setShowAdd(false);
    } catch { /* store */ } finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiVehicle) => {
    setEditId(r._id);
    setEditForm(vehicleToForm(r));
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateItem(editId, formToPayload(editForm) as unknown as Record<string, unknown>);
      setEditId(null);
    } catch { /* store */ } finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch { /* store */ } }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Car size={24} />إدارة المركبات</h1><p className={styles.pageSubtitle}>بيانات المركبات</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY }); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {editId ? <><Pencil size={18} />تعديل مركبة</> : <><Plus size={18} />إضافة مركبة جديدة</>}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الماركة والموديل *</label>
              <input className={styles.formInput} placeholder="الماركة والموديل" value={activeForm.brandAndModel} onChange={e => setActiveForm({ ...activeForm, brandAndModel: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>رقم اللوحة</label>
              <input className={styles.formInput} placeholder="رقم اللوحة" value={activeForm.plateNumber} onChange={e => setActiveForm({ ...activeForm, plateNumber: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>المسؤول</label>
              <EmployeeSelect
                value={activeForm.responsible}
                onChange={responsible => setActiveForm({ ...activeForm, responsible })}
                placeholder="اختر أو أدخل المسؤول"
              />
            </div>
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={editId ? saveEdit : handleAdd} disabled={saving}><Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button className={styles.btnCancel} onClick={() => { setShowAdd(false); setEditId(null); }}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الماركة والموديل</th><th>رقم اللوحة</th><th>المسؤول</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.brandAndModel}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.plateNumber || '—'}</td>
                <td>{getResponsibleDisplay(r)}</td>
                <td><span className={`${styles.badge} ${r.isActive ? styles.badgeGreen : styles.badgeGray}`}>{r.isActive ? 'فعال' : 'غير فعال'}</span></td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
