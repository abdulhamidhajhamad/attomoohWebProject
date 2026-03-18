import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  FileText,
} from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiCustomer, CreateCustomerRequest } from '../../../shared/api/types';
import styles from './CustomersPage.module.css';

const EMPTY_FORM: CreateCustomerRequest = {
  name: '',
  phone: '',
  address: '',
  notes: '',
  hasAnnualContract: false,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CreateCustomerRequest>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CreateCustomerRequest>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Fetch customers on mount and on search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) return;
    setSaving(true);
    try {
      await createCustomer(addForm);
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
    } catch {
      /* error is in store */
    } finally {
      setSaving(false);
    }
  }, [addForm, createCustomer]);

  const handleStartEdit = useCallback((c: ApiCustomer) => {
    setEditId(c._id);
    setEditForm({
      name: c.name,
      phone: c.phone,
      address: c.address || '',
      notes: c.notes || '',
      hasAnnualContract: c.hasAnnualContract,
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateCustomer(editId, editForm);
      setEditId(null);
    } catch {
      /* error is in store */
    } finally {
      setSaving(false);
    }
  }, [editId, editForm, updateCustomer]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`هل أنت متأكد من حذف الزبون "${name}"؟`)) return;
      try {
        await deleteCustomer(id);
      } catch {
        /* error is in store */
      }
    },
    [deleteCustomer],
  );

  if (loading && customers.length === 0) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Users size={24} />
            إدارة الزبائن
          </h1>
          <p className={styles.pageSubtitle}>
            إدارة بيانات الزبائن والعقود السنوية
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              clearError();
              setShowAddForm(!showAddForm);
            }}
          >
            <Plus size={18} />
            زبون جديد
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>العنوان</th>
              <th>عقد سنوي</th>
              <th>ملاحظات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {/* Add Row */}
            {showAddForm && (
              <tr className={styles.addFormRow}>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="اسم الزبون *"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="رقم الهاتف *"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="العنوان"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className={styles.formCheckbox}
                    checked={addForm.hasAnnualContract}
                    onChange={(e) =>
                      setAddForm({ ...addForm, hasAnnualContract: e.target.checked })
                    }
                  />
                </td>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="ملاحظات"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.btnSave}
                      onClick={handleAdd}
                      disabled={saving}
                    >
                      <Check size={14} />
                      حفظ
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={() => setShowAddForm(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {customers.map((c) =>
              editId === c._id ? (
                <tr key={c._id} className={styles.addFormRow}>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className={styles.formCheckbox}
                      checked={editForm.hasAnnualContract}
                      onChange={(e) =>
                        setEditForm({ ...editForm, hasAnnualContract: e.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnSave}
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        <Check size={14} />
                        حفظ
                      </button>
                      <button
                        className={styles.btnCancel}
                        onClick={() => setEditId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>
                    {c.phone}
                  </td>
                  <td>{c.address || '—'}</td>
                  <td>
                    <span
                      className={`${styles.contractBadge} ${
                        c.hasAnnualContract ? styles.contractYes : styles.contractNo
                      }`}
                    >
                      {c.hasAnnualContract ? '✓ نعم' : 'لا'}
                    </span>
                  </td>
                  <td>{c.notes || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleStartEdit(c)}
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDelete(c._id, c.name)}
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}

            {/* Empty */}
            {customers.length === 0 && !showAddForm && (
              <tr>
                <td colSpan={6}>
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
