import { useEffect, useState, useCallback } from 'react';
import { Car, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useVehiclesStore } from '../../../shared/store/vehiclesStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiVehicle } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface AddForm { brandAndModel: string; plateNumber: string; responsiblePerson: string; }
const EMPTY: AddForm = { brandAndModel: '', plateNumber: '', responsiblePerson: '' };

export default function VehiclesPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useVehiclesStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => { if (!addForm.brandAndModel.trim()) return; setSaving(true); try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch { /* store */ } finally { setSaving(false); } }, [addForm, createItem]);
  const startEdit = useCallback((r: ApiVehicle) => { setEditId(r._id); setEditForm({ brandAndModel: r.brandAndModel, plateNumber: r.plateNumber, responsiblePerson: r.responsiblePerson }); }, []);
  const saveEdit = useCallback(async () => { if (!editId) return; setSaving(true); try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch { /* store */ } finally { setSaving(false); } }, [editId, editForm, updateItem]);
  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch { /* store */ } }, [deleteItem]);
  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Car size={24} />إدارة المركبات</h1><p className={styles.pageSubtitle}>بيانات المركبات</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الماركة والموديل</th><th>رقم اللوحة</th><th>المسؤول</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (
              <tr className={styles.addFormRow}>
                <td><span className={styles.customId}>تلقائي</span></td>
                <td><input className={styles.formInput} placeholder="الماركة والموديل *" value={addForm.brandAndModel} onChange={e => setAddForm({ ...addForm, brandAndModel: e.target.value })} /></td>
                <td><input className={styles.formInput} placeholder="رقم اللوحة" value={addForm.plateNumber} onChange={e => setAddForm({ ...addForm, plateNumber: e.target.value })} /></td>
                <td><input className={styles.formInput} placeholder="المسؤول" value={addForm.responsiblePerson} onChange={e => setAddForm({ ...addForm, responsiblePerson: e.target.value })} /></td>
                <td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td>
              </tr>
            )}
            {items.map(r => editId === r._id ? (
              <tr key={r._id} className={styles.addFormRow}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td><input className={styles.formInput} value={editForm.brandAndModel} onChange={e => setEditForm({ ...editForm, brandAndModel: e.target.value })} /></td>
                <td><input className={styles.formInput} value={editForm.plateNumber} onChange={e => setEditForm({ ...editForm, plateNumber: e.target.value })} /></td>
                <td><input className={styles.formInput} value={editForm.responsiblePerson} onChange={e => setEditForm({ ...editForm, responsiblePerson: e.target.value })} /></td>
                <td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td>
              </tr>
            ) : (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.brandAndModel}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.plateNumber || '—'}</td>
                <td>{r.responsiblePerson || '—'}</td>
                <td><span className={`${styles.badge} ${r.isActive ? styles.badgeGreen : styles.badgeGray}`}>{r.isActive ? 'فعال' : 'غير فعال'}</span></td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && !showAdd && <tr><td colSpan={6}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
