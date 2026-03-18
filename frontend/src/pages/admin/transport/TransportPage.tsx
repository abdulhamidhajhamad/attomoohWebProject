import { useEffect, useState, useCallback } from 'react';
import { Truck, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useTransportStore } from '../../../shared/store/transportStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiTransport } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const fmtMin = (ms: number) => ms > 0 ? Math.round(ms / 60000) + ' دقيقة' : '—';

interface AddForm { machineName: string; machineDetails: string; logisticName: string; date: string; }
const EMPTY: AddForm = { machineName: '', machineDetails: '', logisticName: '', date: '' };

export default function TransportPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useTransportStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => { if (!addForm.machineName.trim()) return; setSaving(true); try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch {} finally { setSaving(false); } }, [addForm, createItem]);
  const startEdit = useCallback((r: ApiTransport) => { setEditId(r._id); setEditForm({ machineName: r.machineName, machineDetails: r.machineDetails, logisticName: r.logisticName, date: r.date }); }, []);
  const saveEdit = useCallback(async () => { if (!editId) return; setSaving(true); try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch {} finally { setSaving(false); } }, [editId, editForm, updateItem]);
  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Truck size={24} />إدارة النقل</h1><p className={styles.pageSubtitle}>نقل الآلات وتتبع عمليات النقل</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>اسم الآلة</th><th>تفاصيل</th><th>المسؤول</th><th>التاريخ</th><th>المدة</th><th>جاهز</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (<tr className={styles.addFormRow}><td><input className={styles.formInput} placeholder="اسم الآلة *" value={addForm.machineName} onChange={e => setAddForm({...addForm, machineName: e.target.value})} /></td><td><input className={styles.formInput} placeholder="تفاصيل" value={addForm.machineDetails} onChange={e => setAddForm({...addForm, machineDetails: e.target.value})} /></td><td><input className={styles.formInput} placeholder="المسؤول" value={addForm.logisticName} onChange={e => setAddForm({...addForm, logisticName: e.target.value})} /></td><td><input className={styles.formInput} type="date" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} /></td><td>—</td><td>—</td><td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td></tr>)}
            {items.map(r => editId === r._id ? (<tr key={r._id} className={styles.addFormRow}><td><input className={styles.formInput} value={editForm.machineName} onChange={e => setEditForm({...editForm, machineName: e.target.value})} /></td><td><input className={styles.formInput} value={editForm.machineDetails} onChange={e => setEditForm({...editForm, machineDetails: e.target.value})} /></td><td><input className={styles.formInput} value={editForm.logisticName} onChange={e => setEditForm({...editForm, logisticName: e.target.value})} /></td><td><input className={styles.formInput} type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td><td>—</td><td>—</td><td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td></tr>) : (<tr key={r._id}><td style={{ fontWeight: 600 }}>{r.machineName}</td><td>{r.machineDetails || '—'}</td><td>{r.logisticName || '—'}</td><td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td><td>{fmtMin(r.transportDurationMs)}</td><td><span className={`${styles.badge} ${r.readyForDelivery ? styles.badgeGreen : styles.badgeGray}`}>{r.readyForDelivery ? 'جاهز' : 'غير جاهز'}</span></td><td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td></tr>))}
            {items.length === 0 && !showAdd && <tr><td colSpan={7}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
