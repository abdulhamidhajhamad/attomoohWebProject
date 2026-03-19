import { useState, useEffect, useCallback } from 'react';
import { User, ChevronDown, Keyboard } from 'lucide-react';
import { customersService } from '../../api/services';
import type { ApiCustomer } from '../../api/types';
import styles from './CustomerSelect.module.css';

type InputMode = 'select' | 'manual';

export interface CustomerValue {
  id?: string;
  name: string;
  phone: string;
  address: string;
  mode: InputMode;
}

interface CustomerSelectProps {
  value: CustomerValue;
  onChange: (value: CustomerValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerSelect({
  value,
  onChange,
  placeholder = 'اختر الزبون',
  disabled = false,
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value.mode === 'select' && customers.length === 0) {
      setLoading(true);
      customersService
        .getAll()
        .then(setCustomers)
        .catch(() => setCustomers([]))
        .finally(() => setLoading(false));
    }
  }, [value.mode, customers.length]);

  const toggleMode = useCallback(() => {
    const newMode: InputMode = value.mode === 'select' ? 'manual' : 'select';
    onChange({ id: undefined, name: '', phone: '', address: '', mode: newMode });
    setIsOpen(false);
  }, [value.mode, onChange]);

  const handleSelect = useCallback(
    (customer: ApiCustomer) => {
      onChange({
        id: customer._id,
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
        mode: 'select',
      });
      setIsOpen(false);
    },
    [onChange]
  );

  const handleManualInput = useCallback(
    (field: 'name' | 'phone' | 'address', fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue, id: undefined });
    },
    [onChange, value]
  );

  const clearSelection = useCallback(() => {
    onChange({ id: undefined, name: '', phone: '', address: '', mode: value.mode });
    setIsOpen(false);
  }, [onChange, value.mode]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={`${styles.modeBtn} ${value.mode === 'select' ? styles.active : ''}`}
          onClick={toggleMode}
          disabled={disabled}
          title={value.mode === 'select' ? 'التبديل لإدخال يدوي' : 'التبديل لاختيار من القائمة'}
        >
          {value.mode === 'select' ? <User size={14} /> : <Keyboard size={14} />}
        </button>
      </div>

      {value.mode === 'select' ? (
        <div className={styles.selectWrapper}>
          <button
            type="button"
            className={styles.selectBtn}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
          >
            <span className={value.name ? styles.selectedValue : styles.placeholder}>
              {value.name || placeholder}
            </span>
            <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
          </button>

          {isOpen && !disabled && (
            <div className={styles.dropdown}>
              {loading ? (
                <div className={styles.dropdownLoading}>جاري التحميل...</div>
              ) : customers.length === 0 ? (
                <div className={styles.dropdownEmpty}>لا يوجد زبائن</div>
              ) : (
                <>
                  <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                    <span className={styles.emptyOption}>— بدون زبون —</span>
                  </button>
                  {customers.map((customer) => (
                    <button
                      key={customer._id}
                      type="button"
                      className={`${styles.dropdownItem} ${value.id === customer._id ? styles.selected : ''}`}
                      onClick={() => handleSelect(customer)}
                    >
                      <User size={14} />
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>{customer.name}</span>
                        {customer.phone && <span className={styles.customerPhone}>{customer.phone}</span>}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          className={styles.manualInput}
          placeholder="أدخل اسم الزبون"
          value={value.name}
          onChange={(e) => handleManualInput('name', e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export const EMPTY_CUSTOMER: CustomerValue = { id: undefined, name: '', phone: '', address: '', mode: 'select' };
