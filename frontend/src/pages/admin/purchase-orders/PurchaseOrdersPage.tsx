import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { usePurchaseOrdersStore } from '../../../shared/store/purchaseOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiPurchaseOrder } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const materialLabels: Record<string, string> = { raw_materials: 'مواد خام', spare_parts: 'قطع غيار', tools: 'عدد', other: 'أخرى' };

interface AddForm { requestedByName: string; materialType: string; supplierName: string; notes: string; date: string; }
const EMPTY: AddForm = { requestedByName: '', materialType: 'spare_parts', supplierName: '', notes: '', date: '' };

export default function PurchaseOrdersPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = usePurchaseOrdersStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => { if (!addForm.requestedByName.trim()) return; setSaving(true); try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch {} finally { setSaving(false); } }, [addForm, createItem]);
  const startEdit = useCallback((r: ApiPurchaseOrder) => { setEditId(r._id); setEditForm({ requestedByName: r.requestedByName, materialType: r.materialType, supplierName: r.supplierName, notes: r.notes, date: r.date }); }, []);
  const saveEdit = useCallback(async () => { if (!editId) return; setSaving(true); try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch {} finally { setSaving(false); } }, [editId, editForm, updateItem]);
  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><ShoppingCart size={24} />طلبات المشتريات</h1><p className={styles.pageSubtitle}>إدارة طلبات المشتريات والتوريد</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>التاريخ</th><th>طالب الشراء</th><th>نوع المواد</th><th>المورد</th><th>الموافقة</th><th>ملاحظات</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (<tr className={styles.addFormRow}><td><span className={styles.customId}>تلقائي</span></td><td><input className={styles.formInput} type="date" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} /></td><td><input className={styles.formInput} placeholder="طالب الشراء *" value={addForm.requestedByName} onChange={e => setAddForm({...addForm, requestedByName: e.target.value})} /></td><td><select className={styles.formSelect} value={addForm.materialType} onChange={e => setAddForm({...addForm, materialType: e.target.value})}>{Object.entries(materialLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td><td><input className={styles.formInput} placeholder="المورد" value={addForm.supplierName} onChange={e => setAddForm({...addForm, supplierName: e.target.value})} /></td><td>—</td><td><input className={styles.formInput} placeholder="ملاحظات" value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} /></td><td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td></tr>)}
            {items.map(r => editId === r._id ? (<tr key={r._id} className={styles.addFormRow}><td><span className={styles.customId}>{r.customId}</span></td><td><input className={styles.formInput} type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td><td><input className={styles.formInput} value={editForm.requestedByName} onChange={e => setEditForm({...editForm, requestedByName: e.target.value})} /></td><td><select className={styles.formSelect} value={editForm.materialType} onChange={e => setEditForm({...editForm, materialType: e.target.value})}>{Object.entries(materialLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td><td><input className={styles.formInput} value={editForm.supplierName} onChange={e => setEditForm({...editForm, supplierName: e.target.value})} /></td><td>—</td><td><input className={styles.formInput} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></td><td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td></tr>) : (<tr key={r._id}><td><span className={styles.customId}>{r.customId}</span></td><td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td><td style={{ fontWeight: 600 }}>{r.requestedByName}</td><td>{materialLabels[r.materialType] || r.materialType}</td><td>{r.supplierName || '—'}</td><td><span className={`${styles.badge} ${r.approved ? styles.badgeGreen : styles.badgeYellow}`}>{r.approved ? 'موافق' : 'بانتظار الموافقة'}</span></td><td>{r.notes || '—'}</td><td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td></tr>))}
            {items.length === 0 && !showAdd && <tr><td colSpan={8}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد طلبات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
