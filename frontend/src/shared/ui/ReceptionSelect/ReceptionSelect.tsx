import { useState, useEffect, useCallback } from 'react';
import { Package, ChevronDown } from 'lucide-react';
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
}

export function ReceptionSelect({
  value,
  onChange,
  placeholder = 'اختر الآلة المستلمة',
  disabled = false,
  statusFilter = ['ready'],
}: ReceptionSelectProps) {
  const [receptions, setReceptions] = useState<ApiMachineReception[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (receptions.length === 0) {
      setLoading(true);
      machineReceptionService
        .getAll()
        .then((data) => {
          // Filter by status
          const filtered = data.filter(r => statusFilter.includes(r.status));
          setReceptions(filtered);
        })
        .catch(() => setReceptions([]))
        .finally(() => setLoading(false));
    }
  }, [receptions.length, statusFilter]);

  const getMachineName = (r: ApiMachineReception) => {
    if (r.machine && typeof r.machine === 'object' && 'name' in r.machine) return r.machine.name;
    return r.machineDetails || 'آلة غير محددة';
  };

  const getCustomerName = (r: ApiMachineReception) => {
    if (r.customer && typeof r.customer === 'object' && 'name' in r.customer) return r.customer.name;
    return r.customerName || '';
  };

  const handleSelect = useCallback(
    (reception: ApiMachineReception) => {
      onChange({ id: reception._id, reception });
      setIsOpen(false);
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    onChange({ id: undefined, reception: undefined });
    setIsOpen(false);
  }, [onChange]);

  const displayValue = value.reception
    ? `${getMachineName(value.reception)} - ${getCustomerName(value.reception)}`
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
            ) : receptions.length === 0 ? (
              <div className={styles.dropdownEmpty}>لا يوجد آلات جاهزة للتسليم</div>
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
                    onClick={() => handleSelect(reception)}
                  >
                    <div className={styles.receptionInfo}>
                      <div className={styles.receptionMain}>
                        <Package size={14} />
                        <span className={styles.machineName}>{getMachineName(reception)}</span>
                        <span className={styles.receptionId}>{reception.customId}</span>
                      </div>
                      <div className={styles.receptionDetails}>
                        <span>الزبون: {getCustomerName(reception)}</span>
                        {reception.customerPhone && <span> | {reception.customerPhone}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const EMPTY_RECEPTION: ReceptionValue = { id: undefined, reception: undefined };
