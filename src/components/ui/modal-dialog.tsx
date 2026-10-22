import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalDialogProps {
  /** Nome acessível do diálogo (aria-label). Ignorado se `labelledBy` vier. */
  label: string;
  /** id do elemento que nomeia o diálogo (aria-labelledby). */
  labelledBy?: string;
  onClose: () => void;
  /** Classes do fundo (overlay). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Overlay modal acessível: role="dialog", aria-modal, foco preso (Tab/Shift+Tab ciclam),
 * Esc fecha, foco inicial no primeiro controle e retorno do foco ao elemento que abriu.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({ label, labelledBy, onClose, className, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const items = () => (node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : []);
    (items()[0] ?? node)?.focus();
    return () => previous?.focus?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </div>
  );
};
