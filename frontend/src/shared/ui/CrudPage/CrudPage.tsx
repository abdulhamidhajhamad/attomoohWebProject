import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit3, X, Loader2 } from 'lucide-react';
import styles from './CrudPage.module.css';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export interface CrudPageProps<T extends { _id: string }> {
  title: string;
  columns: Column<T>[];
  fetchItems: () => Promise<T[]>;
  searchItems?: (query: string) => Promise<T[]>;
  createItem?: (data: Record<string, unknown>) => Promise<T>;
  updateItem?: (id: string, data: Record<string, unknown>) => Promise<T>;
  deleteItem?: (id: string) => Promise<void>;
  renderForm?: (
    item: T | null,
    onSubmit: (data: Record<string, unknown>) => void,
    onCancel: () => void,
  ) => React.ReactNode;
  idField?: string;
}

export function CrudPage<T extends { _id: string }>({
  title,
  columns,
  fetchItems,
  searchItems,
  createItem,
  updateItem,
  deleteItem,
  renderForm,
  idField = 'customId',
}: CrudPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = search && searchItems
        ? await searchItems(search)
        : await fetchItems();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }, [fetchItems, searchItems, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: Record<string, unknown>) => {
    if (!createItem) return;
    try {
      await createItem(data);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!updateItem || !editItem) return;
    try {
      await updateItem(editItem._id, data);
      setEditItem(null);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!deleteItem) return;
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteItem(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    }
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.actions}>
          {searchItems && (
            <div className={styles.searchBox}>
              <Search size={16} />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button onClick={() => setSearch('')} className={styles.clearBtn}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          {createItem && renderForm && (
            <button className={styles.addBtn} onClick={() => { setEditItem(null); setShowForm(true); }}>
              <Plus size={18} />
              <span>إضافة</span>
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Form Modal */}
      {showForm && renderForm && (
        <div className={styles.modalOverlay} onClick={closeForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editItem ? 'تعديل' : 'إضافة جديد'}</h2>
              <button onClick={closeForm} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {renderForm(editItem, editItem ? handleUpdate : handleCreate, closeForm)}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spinner} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>لا توجد بيانات</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {(updateItem || deleteItem) && <th>إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id}>
                  <td>{(item as Record<string, unknown>)[idField] as string || idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {(updateItem || deleteItem) && (
                    <td>
                      <div className={styles.rowActions}>
                        {updateItem && renderForm && (
                          <button onClick={() => openEdit(item)} className={styles.editBtn}>
                            <Edit3 size={15} />
                          </button>
                        )}
                        {deleteItem && (
                          <button onClick={() => handleDelete(item._id)} className={styles.deleteBtn}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CrudPage;
