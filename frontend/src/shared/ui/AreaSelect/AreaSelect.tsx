import { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { areasService } from '../../api/services';
import type { ApiArea } from '../../api/types';
import styles from './AreaSelect.module.css';

export interface AreaValue {
  id?: string;
  name: string;
}

interface AreaSelectProps {
  value: AreaValue;
  onChange: (value: AreaValue) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AreaSelect({
  value,
  onChange,
  placeholder = 'اختر المنطقة',
  disabled = false,
}: AreaSelectProps) {
  const [areas, setAreas] = useState<ApiArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (areas.length === 0) {
      setLoading(true);
      areasService
        .getAll()
        .then(setAreas)
        .catch(() => setAreas([]))
        .finally(() => setLoading(false));
    }
  }, [areas.length]);

  const handleSelect = useCallback(
    (area: ApiArea) => {
      onChange({ id: area._id, name: area.name });
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
          <MapPin size={16} className={styles.icon} />
          <span className={value.name ? styles.selectedValue : styles.placeholder}>
            {value.name || placeholder}
          </span>
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {loading ? (
              <div className={styles.dropdownLoading}>جاري التحميل...</div>
            ) : areas.length === 0 ? (
              <div className={styles.dropdownEmpty}>لا يوجد مناطق</div>
            ) : (
              <>
                <button type="button" className={styles.dropdownItem} onClick={clearSelection}>
                  <span className={styles.emptyOption}>— بدون منطقة —</span>
                </button>
                {areas.map((area) => (
                  <button
                    key={area._id}
                    type="button"
                    className={`${styles.dropdownItem} ${value.id === area._id ? styles.selected : ''}`}
                    onClick={() => handleSelect(area)}
                  >
                    <MapPin size={14} />
                    <span>{area.name}</span>
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

export const EMPTY_AREA: AreaValue = { id: undefined, name: '' };
