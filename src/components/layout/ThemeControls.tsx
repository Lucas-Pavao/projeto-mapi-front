import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { ACCENT_LABEL } from '@/lib/theme';

const btn =
  'flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent text-xs leading-4 font-semibold text-foreground hover:bg-muted md:h-9';

/** Alternar tema (escuro/claro) e cor de destaque (Capibaribe, Atlântico, Areia). */
export const ThemeControls: React.FC = () => {
  const { theme, accent, toggleTheme, cycleAccent } = useTheme();
  const themeLabel = theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';
  return (
    <>
      <button type="button" onClick={cycleAccent} aria-label={`${ACCENT_LABEL[accent]}: trocar cor de destaque`} title={`Cor de destaque: ${ACCENT_LABEL[accent]}`} className={`${btn} px-2.5`}>
        <span aria-hidden="true" className="size-3.5 rounded-full bg-primary shadow-[0_0_0_2px_var(--card),0_0_0_3px_var(--border)]" />
        <span className="hidden lg:inline">{ACCENT_LABEL[accent]}</span>
      </button>
      <button type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel} className={`${btn} w-11 md:w-9`}>
        {theme === 'dark' ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
      </button>
    </>
  );
};
