import { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, ChevronDown, X, Check, Info } from 'lucide-react';
import { machineReceptionService } from '../../api/services';
import type { ApiMachineReception } from '../../api/types';
import styles from './ReceptionSelect.module.css';

export interface ReceptionValue {
  id?: string;
  reception?: ApiMachineReception;
}

interface ReceptionSelectProps {
  value: ReceptionValue;
  onChange: (value: ReceptionValue) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Filter by status - default shows only 'ready' machines */
  statusFilter?: string[];
  /** Hide receptions already assigned in inspection/maintenance tables */
  excludeAssignedTasks?: boolean;
}

const DEFAULT_STATUS_FILTER = ['ready'];

export function ReceptionSelect({
  value,
  onChange,
  placeholder = 'اختر الآلة المستلمة',
  disabled = false,
  statusFilter = DEFAULT_STATUS_FILTER,
  excludeAssignedTasks = false,
}: ReceptionSelectProps) {
  const [receptions, setReceptions] = useState<ApiMachineReception[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ApiMachineReception | null>(null);

  const statusFilterKey = useMemo(() => statusFilter.join('|'), [statusFilter]);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const normalizedFilter = statusFilter.map((s) => s.trim()).filter(Boolean);
        const canQuerySingleStatus = normalizedFilter.length === 1;
        const data = canQuerySingleStatus
          ? await machineReceptionService.getAll({
              status: normalizedFilter[0],
              excludeAssigned: excludeAssignedTasks,
            })
          : await machineReceptionService.getAll({ excludeAssigned: excludeAssignedTasks });

        const filtered = normalizedFilter.length > 0
          ? data.filter((r) => normalizedFilter.includes(r.status))
          : data;

        // Keep current form value visible while editing even if now filtered out.
        const selected = value.reception;
        const withCurrentSelection =
          selected && !filtered.some((r) => r._id === selected._id)
            ? [selected, ...filtered]
            : filtered;

        if (isMounted) {
          setReceptions(withCurrentSelection);
        }
      } catch {
        if (isMounted) {
          setReceptions(value.reception ? [value.reception] : []);
          setError('تعذر تحميل الآلات');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [statusFilterKey, excludeAssignedTasks, value.reception]);

  const getMachineName = (r: ApiMachineReception) => {
    if (r.machine && typeof r.machine === 'object' && 'name' in r.machine) return r.machine.name;
    return '';
  };

  const getMachineDetails = (r: ApiMachineReception) => {
    return r.machineDetails?.trim() || getMachineName(r) || 'آلة غير محددة';
  };

  const getCustomerName = (r: ApiMachineReception) => {
    if (r.customer && typeof r.customer === 'object' && 'name' in r.customer) return r.customer.name;
    return r.customerName || '';
  };

  const handleItemClick = useCallback((reception: ApiMachineReception) => {
    setConfirmModal(reception);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (confirmModal) {
      onChange({ id: confirmModal._id, reception: confirmModal });
      setConfirmModal(null);
      setIsOpen(false);
    }
  }, [confirmModal, onChange]);

  const handleCancelSelection = useCallback(() => {
    setConfirmModal(null);
    setIsOpen(false);
  }, []);

  const clearSelection = useCallback(() => {
    onChange({ id: undefined, reception: undefined });
    setIsOpen(false);
  }, [onChange]);

  const displayValue = value.reception
    ? `${value.reception.customId} - ${getMachineDetails(value.reception)} - ${getCustomerName(value.reception) || 'بدون زبون'}`
    : '';

  return (
    <div className={styles.container}>
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectBtn}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Package size={16} className={styles.icon} />
          <span className={displayValue ? styles.selectedValue : styles.placeholder}>
            {displayValue || placeholder}
          </span>
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {loading ? (
              <div className={styles.dropdownLoading}>جاري التحميل...</div>
            ) : error ? (
              <div className={styles.dropdownEmpty} style={{ color: '#ef4444' }}>{error}</div>
            ) : receptions.length === 0 ? (
              <div className={styles.dropdownEmpty}>لا يوجد آلات متاحة</div>
            ) : (
              <>
                <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                  <span className={styles.emptyOption}>— إلغاء الاختيار —</span>
                </button>
                {receptions.map((reception) => (
                  <button
                    key={reception._id}
                    type="button"
                    className={`${styles.dropdownItem} ${value.id === reception._id ? styles.selected : ''}`}
                    onClick={() => handleItemClick(reception)}
                  >
                    <div className={styles.receptionInfo}>
                      <div className={styles.receptionMain}>
                        <Package size={14} />
                        <span className={styles.machineDetails}>{getMachineDetails(reception)}</span>
                        <span className={styles.receptionId}>{reception.customId}</span>
                      </div>
                      <div className={styles.receptionDetails}>
                        <span>الزبون: {getCustomerName(reception) || '—'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className={styles.modalOverlay} onClick={handleCancelSelection}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><Info size={20} /> تأكيد اختيار الآلة</h3>
              <button className={styles.modalClose} onClick={handleCancelSelection}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>رمز التعريف:</span>
                  <span className={styles.infoValue}>{confirmModal.customId}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>اسم الآلة:</span>
                  <span className={styles.infoValue} style={{ fontWeight: 700, color: '#1f2937' }}>
                    {getMachineName(confirmModal)}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>تفاصيل الآلة:</span>
                  <span className={styles.infoValue} style={{ fontWeight: 600, color: '#374151' }}>
                    {confirmModal.machineDetails || '—'}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>اسم الزبون:</span>
                  <span className={styles.infoValue} style={{ fontWeight: 700, color: '#1f2937' }}>
                    {getCustomerName(confirmModal)}
                  </span>
                </div>

                {confirmModal.customerPhone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>هاتف الزبون:</span>
                    <span className={styles.infoValue} dir="ltr" style={{ textAlign: 'right' }}>
                      {confirmModal.customerPhone}
                    </span>
                  </div>
                )}

                {confirmModal.customerAddress && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>عنوان الزبون:</span>
                    <span className={styles.infoValue}>{confirmModal.customerAddress}</span>
                  </div>
                )}

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>الرقم التسلسلي:</span>
                  <span className={styles.infoValue}>{confirmModal.serialNumber || '—'}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>حالة الآلة:</span>
                  <span className={styles.infoValue}>
                    {confirmModal.condition === 'complete' ? 'كاملة' : 'ناقصة'}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>الضمان:</span>
                  <span className={styles.infoValue}>
                    {confirmModal.warranty ? 'تحت الضمان' : 'خارج الضمان'}
                  </span>
                </div>

                {confirmModal.receivedParts && (
                  <div className={styles.infoRow} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.infoLabel}>القطع المستلمة:</span>
                    <span className={styles.infoValue}>{confirmModal.receivedParts}</span>
                  </div>
                )}

                {confirmModal.customerProblemDesc && (
                  <div className={styles.infoRow} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.infoLabel}>وصف مشكلة الزبون:</span>
                    <span className={styles.infoValue}>{confirmModal.customerProblemDesc}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={handleCancelSelection}>
                <X size={16} />
                إلغاء
              </button>
              <button className={styles.btnConfirm} onClick={handleConfirmSelection}>
                <Check size={16} />
                تأكيد الاختيار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const EMPTY_RECEPTION: ReceptionValue = { id: undefined, reception: undefined };
