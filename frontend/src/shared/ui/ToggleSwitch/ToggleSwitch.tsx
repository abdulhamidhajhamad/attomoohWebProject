import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
  /** Current toggle state */
  checked: boolean;
  /** Callback when toggle is clicked */
  onChange: (checked: boolean) => void;
  /** Label text displayed next to the toggle */
  label: string;
  /** Optional id for accessibility */
  id?: string;
}

/**
 * Reusable toggle switch component for admin forms.
 * Follows SRP — only handles boolean on/off state display and interaction.
 */
export function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <div className={styles.toggleGroup}>
      <label className={styles.toggleLabel} htmlFor={id}>
        <span>{label}</span>
        <div
          className={`${styles.toggle} ${checked ? styles.toggleActive : ''}`}
          onClick={() => onChange(!checked)}
          role="switch"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(!checked);
            }
          }}
        >
          <div className={styles.toggleThumb} />
        </div>
      </label>
    </div>
  );
}
