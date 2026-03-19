import { useState, useEffect, useCallback } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { machinesService } from '../../api/services';
import type { ApiMachine } from '../../api/types';
import styles from './MachineSelect.module.css';

export interface MachineValue {
  id?: string;
  name: string;
}

interface MachineSelectProps {
  value: MachineValue;
  onChange: (value: MachineValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MachineSelect({
  value,
  onChange,
  placeholder = 'اختر الآلة',
  disabled = false,
}: MachineSelectProps) {
  const [machines, setMachines] = useState<ApiMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (machines.length === 0) {
      setLoading(true);
      machinesService
        .getAll()
        .then(setMachines)
        .catch(() => setMachines([]))
        .finally(() => setLoading(false));
    }
  }, [machines.length]);

  const handleSelect = useCallback(
    (machine: ApiMachine) => {
      onChange({ id: machine._id, name: machine.name });
      setIsOpen(false);
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    onChange({ id: undefined, name: '' });
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className={styles.container}>
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectBtn}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Settings size={16} className={styles.icon} />
          <span className={value.name ? styles.selectedValue : styles.placeholder}>
            {value.name || placeholder}
          </span>
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {loading ? (
              <div className={styles.dropdownLoading}>جاري التحميل...</div>
            ) : machines.length === 0 ? (
              <div className={styles.dropdownEmpty}>لا يوجد آلات</div>
            ) : (
              <>
                <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                  <span className={styles.emptyOption}>— بدون آلة —</span>
                </button>
                {machines.map((machine) => (
                  <button
                    key={machine._id}
                    type="button"
                    className={`${styles.dropdownItem} ${value.id === machine._id ? styles.selected : ''}`}
                    onClick={() => handleSelect(machine)}
                  >
                    <Settings size={14} />
                    <span>{machine.name}</span>
                    <span className={styles.machineId}>{machine.customId}</span>
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

export const EMPTY_MACHINE: MachineValue = { id: undefined, name: '' };
