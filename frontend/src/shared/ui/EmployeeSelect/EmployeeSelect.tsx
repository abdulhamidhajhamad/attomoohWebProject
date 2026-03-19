import { useState, useEffect, useCallback } from 'react';
import { User, ChevronDown, Keyboard } from 'lucide-react';
import { employeesService } from '../../api/services';
import type { ApiEmployee } from '../../api/types';
import styles from './EmployeeSelect.module.css';

type InputMode = 'select' | 'manual';

export interface EmployeeValue {
  id?: string;
  name: string;
  mode: InputMode;
}

interface EmployeeSelectProps {
  value: EmployeeValue;
  onChange: (value: EmployeeValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EmployeeSelect({
  value,
  onChange,
  placeholder = 'اختر الموظف',
  disabled = false,
}: EmployeeSelectProps) {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value.mode === 'select' && employees.length === 0) {
      setLoading(true);
      employeesService
        .getAll()
        .then(setEmployees)
        .catch(() => setEmployees([]))
        .finally(() => setLoading(false));
    }
  }, [value.mode, employees.length]);

  const toggleMode = useCallback(() => {
    const newMode: InputMode = value.mode === 'select' ? 'manual' : 'select';
    onChange({ id: undefined, name: '', mode: newMode });
    setIsOpen(false);
  }, [value.mode, onChange]);

  const handleSelect = useCallback(
    (emp: ApiEmployee) => {
      onChange({ id: emp._id, name: emp.name, mode: 'select' });
      setIsOpen(false);
    },
    [onChange]
  );

  const handleManualInput = useCallback(
    (name: string) => {
      onChange({ id: undefined, name, mode: 'manual' });
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    onChange({ id: undefined, name: '', mode: value.mode });
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
              ) : employees.length === 0 ? (
                <div className={styles.dropdownEmpty}>لا يوجد موظفين</div>
              ) : (
                <>
                  <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                    <span className={styles.emptyOption}>— بدون مسؤول —</span>
                  </button>
                  {employees.map((emp) => (
                    <button
                      key={emp._id}
                      type="button"
                      className={`${styles.dropdownItem} ${value.id === emp._id ? styles.selected : ''}`}
                      onClick={() => handleSelect(emp)}
                    >
                      <User size={14} />
                      <span>{emp.name}</span>
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
          placeholder="أدخل اسم المسؤول"
          value={value.name}
          onChange={(e) => handleManualInput(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export const EMPTY_EMPLOYEE: EmployeeValue = { id: undefined, name: '', mode: 'select' };
