import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, MessageCircle } from 'lucide-react';
import { BRANCHES, type Branch } from '../../../shared/constants/branches';
import { WHATSAPP_BASE_URL } from '../../../shared/constants';
import styles from './BranchSelector.module.css';

/* ═══════════════════════════════════
   Props
   ═══════════════════════════════════ */

interface BranchSelectorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

/**
 * BranchSelectorModal — a clean, modern popup that lets the user
 * choose which branch to contact via WhatsApp.
 *
 * SRP: Only responsible for rendering the modal UI and handling branch selection.
 * OCP: Branch list comes from `branches.ts` — add branches without touching this component.
 */
export function BranchSelectorModal({ isOpen, message, onClose }: BranchSelectorModalProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'en';
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Close on Escape key ───────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // ── Close on backdrop click ───────
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  // ── Open WhatsApp with the selected branch ───
  const handleBranchSelect = useCallback(
    (branch: Branch) => {
      const phone = branch.phone.replace(/\+/g, '');
      const url = `${WHATSAPP_BASE_URL}${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      onClose();
    },
    [message, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ar' ? 'اختيار الفرع' : 'Select Branch'}
    >
      <div className={styles.modal}>
        {/* Close button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <MessageCircle size={28} />
          </div>
          <h2 className={styles.title}>
            {lang === 'ar' ? 'اختر الفرع' : 'Choose a Branch'}
          </h2>
          <p className={styles.subtitle}>
            {lang === 'ar'
              ? 'اختر الفرع الأقرب لك للتواصل عبر واتساب'
              : 'Select the nearest branch to contact via WhatsApp'}
          </p>
        </div>

        {/* Branch cards */}
        <div className={styles.branches}>
          {BRANCHES.map((branch) => (
            <button
              key={branch.id}
              type="button"
              className={styles.branchCard}
              onClick={() => handleBranchSelect(branch)}
            >
              <div className={styles.branchIcon}>
                <MapPin size={22} />
              </div>
              <div className={styles.branchInfo}>
                <span className={styles.branchName}>
                  {lang === 'ar' ? branch.name.ar : branch.name.en}
                </span>
                <span className={styles.branchPhone}>
                  {branch.phone}
                </span>
              </div>
              <div className={styles.branchArrow}>
                <MessageCircle size={18} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
