import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}
