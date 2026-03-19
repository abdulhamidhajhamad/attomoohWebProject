import { useState, useEffect, useCallback } from 'react';
import { User, ChevronDown, Keyboard } from 'lucide-react';
import { maintenanceService } from '../../api/services';
import type { ApiTechnician } from '../../api/types';
import styles from './TechnicianSelect.module.css';

type InputMode = 'select' | 'manual';

export interface TechnicianValue {
  id?: string;
  name: string;
  mode: InputMode;
}

interface TechnicianSelectProps {
  value: TechnicianValue;
  onChange: (value: TechnicianValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TechnicianSelect({
  value,
  onChange,
  placeholder = 'اختر الفني',
  disabled = false,
}: TechnicianSelectProps) {
  const [technicians, setTechnicians] = useState<ApiTechnician[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value.mode === 'select' && technicians.length === 0) {
      setLoading(true);
      maintenanceService
        .getTechnicians()
        .then(setTechnicians)
        .catch(() => setTechnicians([]))
        .finally(() => setLoading(false));
    }
  }, [value.mode, technicians.length]);

  const toggleMode = useCallback(() => {
    const newMode: InputMode = value.mode === 'select' ? 'manual' : 'select';
    onChange({ id: undefined, name: '', mode: newMode });
    setIsOpen(false);
  }, [value.mode, onChange]);

  const handleSelect = useCallback(
    (tech: ApiTechnician) => {
      onChange({ id: tech._id, name: tech.name, mode: 'select' });
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
              ) : technicians.length === 0 ? (
                <div className={styles.dropdownEmpty}>لا يوجد فنيين</div>
              ) : (
                <>
                  <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                    <span className={styles.emptyOption}>— بدون فني —</span>
                  </button>
                  {technicians.map((tech) => (
                    <button
                      key={tech._id}
                      type="button"
                      className={`${styles.dropdownItem} ${value.id === tech._id ? styles.selected : ''}`}
                      onClick={() => handleSelect(tech)}
                    >
                      <User size={14} />
                      <span>{tech.name}</span>
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
          placeholder="أدخل اسم الفني"
          value={value.name}
          onChange={(e) => handleManualInput(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export const EMPTY_TECHNICIAN: TechnicianValue = { id: undefined, name: '', mode: 'select' };
