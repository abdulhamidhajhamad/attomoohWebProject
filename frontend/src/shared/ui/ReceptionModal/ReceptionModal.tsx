import { useState, useEffect } from 'react';
import { Package, X, Calendar, User, Phone } from 'lucide-react';
import { machineReceptionService } from '../../api/services';
import type { ApiMachineReception } from '../../api/types';
import styles from './ReceptionModal.module.css';

export interface ReceptionValue {
  id?: string;
  reception?: ApiMachineReception;
}

interface ReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: ReceptionValue) => void;
  /** Filter by status - default shows only 'ready' machines */
  statusFilter?: string[];
}

const DEFAULT_STATUS_FILTER = ['ready'];

export function ReceptionModal({
  isOpen,
  onClose,
  onSelect,
  statusFilter = DEFAULT_STATUS_FILTER,
}: ReceptionModalProps) {
  const [receptions, setReceptions] = useState<ApiMachineReception[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      (async () => {
        try {
          const canQuerySingleStatus = statusFilter.length === 1;
          const shouldIncludeExternalPending = canQuerySingleStatus && statusFilter[0] === 'ready';
          const data = canQuerySingleStatus
            ? await machineReceptionService.getAll({
              status: statusFilter[0],
              includeExternalPending: shouldIncludeExternalPending,
            })
            : await machineReceptionService.getAll();
          const shouldKeepBackendCandidates = canQuerySingleStatus && statusFilter[0] === 'ready' && shouldIncludeExternalPending;
          const filtered = shouldKeepBackendCandidates
            ? data
            : data.filter(r => statusFilter.includes(r.status));
          setReceptions(filtered);
        } catch (e) {
          setReceptions([]);
          setError('تعذر تحميل الآلات الجاهزة، حاول مرة أخرى.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, statusFilter]);

  const getMachineName = (r: ApiMachineReception) => {
    if (r.machine && typeof r.machine === 'object' && 'name' in r.machine) return r.machine.name;
    return '';
  };

  const getMachineDisplay = (r: ApiMachineReception) => {
    const name = getMachineName(r).trim();
    const details = (r.machineDetails || '').trim();

    if (name && details && details !== name) {
      return `${name} - ${details}`;
    }

    return name || details || 'آلة غير محددة';
  };

  const getCustomerName = (r: ApiMachineReception) => {
    if (r.customer && typeof r.customer === 'object' && 'name' in r.customer) return r.customer.name;
    return r.customerName || 'غير محدد';
  };

  const handleSelect = (reception: ApiMachineReception) => {
    setSelectedId(reception._id);
    onSelect({ id: reception._id, reception });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Package size={20} />
            الآلات الجاهزة للتسليم
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>جاري التحميل...</div>
          ) : error ? (
            <div className={styles.empty} style={{ color: '#ef4444' }}>{error}</div>
          ) : receptions.length === 0 ? (
            <div className={styles.empty}>
              <Package size={48} />
              <p>لا يوجد آلات جاهزة للتسليم</p>
            </div>
          ) : (
            <div className={styles.receptionsList}>
              {receptions.map((reception) => (
                <button
                  key={reception._id}
                  className={`${styles.receptionCard} ${selectedId === reception._id ? styles.selected : ''}`}
                  onClick={() => handleSelect(reception)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.machineInfo}>
                      <Package size={18} className={styles.icon} />
                      <span className={styles.machineName}>{getMachineDisplay(reception)}</span>
                    </div>
                    <span className={styles.receptionId}>{reception.customId}</span>
                  </div>

                  <div className={styles.cardDetails}>
                    <div className={styles.detailRow}>
                      <User size={14} />
                      <span className={styles.label}>الزبون:</span>
                      <span className={styles.value}>{getCustomerName(reception)}</span>
                    </div>

                    {reception.customerPhone && (
                      <div className={styles.detailRow}>
                        <Phone size={14} />
                        <span className={styles.label}>الجوال:</span>
                        <span className={styles.value}>{reception.customerPhone}</span>
                      </div>
                    )}

                    <div className={styles.detailRow}>
                      <Calendar size={14} />
                      <span className={styles.label}>تاريخ الاستلام:</span>
                      <span className={styles.value}>
                        {new Date(reception.receptionDate).toLocaleDateString('ar-SA')}
                      </span>
                    </div>

                    {reception.customerProblemDesc && (
                      <div className={styles.problemDesc}>
                        <span className={styles.label}>المشكلة:</span>
                        <span className={styles.value}>{reception.customerProblemDesc}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export const EMPTY_RECEPTION: ReceptionValue = { id: undefined, reception: undefined };
