import { useEffect, useState, useCallback } from 'react';
import { Truck, Plus, Search, Trash2, Pencil, X, Check, FileText, StickyNote } from 'lucide-react';
import { useSuppliersStore } from '../../../shared/store/suppliersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiSupplier } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface SupplierForm { name: string; phone: string; address: string; notes: string; }
const EMPTY: SupplierForm = { name: '', phone: '', address: '', notes: '' };

export default function SuppliersPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useSuppliersStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<SupplierForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupplierForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch { /* store */ } finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiSupplier) => {
    setEditId(r._id);
    setEditForm({ name: r.name, phone: r.phone, address: r.address, notes: r.notes });
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch { /* store */ } finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try { await deleteItem(id); } catch { /* store */ }
  }, [deleteItem]);

  const areaName = (a: unknown) => (a && typeof a === 'object' && 'city' in (a as Record<string, unknown>)) ? (a as { city: string }).city : '—';

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}><Truck size={24} />إدارة الموردين</h1>
          <p className={styles.pageSubtitle}>إدارة بيانات الموردين</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY }); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Modern Form Card ── */}
      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل مورّد</> : <><Plus size={18} />إضافة مورّد جديد</>}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الاسم *</label>
              <input className={styles.formInput} placeholder="اسم المورّد" value={activeForm.name} onChange={e => setActiveForm({ ...activeForm, name: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الهاتف</label>
              <input className={styles.formInput} placeholder="رقم الهاتف" value={activeForm.phone} onChange={e => setActiveForm({ ...activeForm, phone: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>العنوان</label>
              <input className={styles.formInput} placeholder="العنوان" value={activeForm.address} onChange={e => setActiveForm({ ...activeForm, address: e.target.value })} />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}><StickyNote size={14} /> ملاحظات</label>
              <textarea className={styles.formTextarea} placeholder="أضف ملاحظات عن المورّد..." value={activeForm.notes} onChange={e => setActiveForm({ ...activeForm, notes: e.target.value })} />
            </div>
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving}><Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button className={styles.btnCancel} onClick={() => { setShowAdd(false); setEditId(null); }}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الاسم</th><th>الهاتف</th><th>المنطقة</th><th>العنوان</th><th>ملاحظات</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.phone || '—'}</td>
                <td>{areaName(r.area)}</td>
                <td>{r.address || '—'}</td>
                <td style={{ maxWidth: 200, fontSize: '0.85rem', color: '#6b7280' }}>{r.notes || '—'}</td>
                <td><span className={`${styles.badge} ${r.isActive ? styles.badgeGreen : styles.badgeGray}`}>{r.isActive ? 'فعال' : 'غير فعال'}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button>
                    <button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
