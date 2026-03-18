import { useEffect, useState, useCallback } from 'react';
import { Receipt, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useFinancialDocumentsStore } from '../../../shared/store/financialDocumentsStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiFinancialDocument } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const typeLabels: Record<string, string> = { receipt_voucher: 'سند قبض', payment_voucher: 'سند صرف', discount: 'خصم', sales_invoice: 'فاتورة مبيعات', purchase_invoice: 'فاتورة مشتريات', price_quote: 'عرض سعر', technician_transfer: 'تحويل فني' };

interface AddForm { type: string; date: string; description: string; amount: number; notes: string; }
const EMPTY: AddForm = { type: 'receipt_voucher', date: '', description: '', amount: 0, notes: '' };

export default function FinancialDocumentsPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useFinancialDocumentsStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => { if (!addForm.description.trim()) return; setSaving(true); try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch {} finally { setSaving(false); } }, [addForm, createItem]);
  const startEdit = useCallback((r: ApiFinancialDocument) => { setEditId(r._id); setEditForm({ type: r.type, date: r.date, description: r.description, amount: r.amount, notes: r.notes }); }, []);
  const saveEdit = useCallback(async () => { if (!editId) return; setSaving(true); try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch {} finally { setSaving(false); } }, [editId, editForm, updateItem]);
  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Receipt size={24} />المستندات المالية</h1><p className={styles.pageSubtitle}>إدارة المستندات المالية والفواتير</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>رقم المستند</th><th>النوع</th><th>التاريخ</th><th>الوصف</th><th>المبلغ</th><th>الإجمالي</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (<tr className={styles.addFormRow}><td><span className={styles.customId}>تلقائي</span></td><td><select className={styles.formSelect} value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value})}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td><td><input className={styles.formInput} type="date" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} /></td><td><input className={styles.formInput} placeholder="الوصف *" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} /></td><td><input className={styles.formInput} type="number" placeholder="المبلغ" value={addForm.amount || ''} onChange={e => setAddForm({...addForm, amount: +e.target.value})} /></td><td>—</td><td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td></tr>)}
            {items.map(r => editId === r._id ? (<tr key={r._id} className={styles.addFormRow}><td><span className={styles.customId}>{r.documentNumber}</span></td><td><select className={styles.formSelect} value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td><td><input className={styles.formInput} type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td><td><input className={styles.formInput} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></td><td><input className={styles.formInput} type="number" value={editForm.amount || ''} onChange={e => setEditForm({...editForm, amount: +e.target.value})} /></td><td>—</td><td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td></tr>) : (<tr key={r._id}><td><span className={styles.customId}>{r.documentNumber}</span></td><td><span className={`${styles.badge} ${styles.badgeBlue}`}>{typeLabels[r.type] || r.type}</span></td><td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td><td>{r.description || '—'}</td><td dir="ltr" style={{ textAlign: 'right' }}>{r.amount?.toLocaleString('ar') || '0'}</td><td dir="ltr" style={{ textAlign: 'right', fontWeight: 600 }}>{r.total?.toLocaleString('ar') || '0'}</td><td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td></tr>))}
            {items.length === 0 && !showAdd && <tr><td colSpan={7}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد مستندات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
