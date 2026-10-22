import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  /** Recebe o id e os aria-* do campo. */
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}

/** Rótulo + controle + dica + erro, com ligação por id (leitor de tela anuncia dica e erro). */
export const Field: React.FC<FieldProps> = ({ label, hint, error, className, children }) => {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-body-strong text-foreground">{label}</label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && <p id={`${id}-hint`} className="text-caption text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-caption text-destructive">{error}</p>}
    </div>
  );
};

const control = 'w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm';

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(control, 'h-11 md:h-8', className)} {...p} />
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(control, 'min-h-20 py-2', className)} {...p} />
));
Textarea.displayName = 'Textarea';
