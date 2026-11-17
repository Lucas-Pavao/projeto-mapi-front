import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import type { OfficialWarning } from '../schemas/officialWarning.schema';

interface Props {
  warnings?: OfficialWarning[];
  className?: string;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const safeHex = (hex: string | null | undefined): string | undefined =>
  hex && HEX_COLOR.test(hex.trim()) ? hex.trim() : undefined;

const formatWindow = (fromIso: string, toIso: string): string | null => {
  const from = formatRecife(fromIso);
  const to = formatRecife(toIso);
  if (!from || !to) return null;
  return `${from} → ${to}`;
};

/**
 * Selo de aviso meteorológico oficial vigente do INMET (ADR 0024).
 * Exibe explicitamente a origem oficial e que não se trata da previsão do MAPi.
 * Sem aviso vigente, não renderiza nada.
 */
export const OfficialWarningBadge: React.FC<Props> = ({ warnings, className }) => {
  if (!warnings || warnings.length === 0) return null;

  const primary = warnings[0];
  const color = safeHex(primary.colorHex);
  const windowText = formatWindow(primary.validFrom, primary.validTo);
  const extraCount = warnings.length - 1;
  const inmetUrl = primary.externalId != null
    ? `https://avisos.inmet.gov.br/${primary.externalId}`
    : 'https://avisos.inmet.gov.br';

  return (
    <section
      aria-label="Aviso oficial do INMET vigente"
      data-testid="inmet-official-warning"
      className={cn(
        'flex flex-col gap-1 rounded-[10px] border border-warning/60 bg-warning/10 px-2.5 py-2 text-xs leading-4 text-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <span
            aria-hidden="true"
            className="inline-block size-2.5 shrink-0 rounded-full border border-border"
            style={color ? { backgroundColor: color } : undefined}
          />
          <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
          <span>Aviso oficial do INMET vigente</span>
        </span>
        <span className="rounded bg-card px-1.5 py-0.5 font-semibold text-foreground">
          {primary.severity}
          {extraCount > 0 && ` (+${extraCount})`}
        </span>
      </div>

      {primary.description && (
        <p className="m-0 font-semibold text-foreground">{primary.description}</p>
      )}
      {primary.risks.length > 0 && (
        <p className="m-0 text-muted-foreground">{primary.risks[0]}</p>
      )}
      {windowText && (
        <p className="m-0 font-mono text-[11px] text-muted-foreground">Vigência: {windowText} (Recife)</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-muted-foreground">
        <span>Aviso oficial do INMET (não é previsão do MAPi)</span>
        <a
          href={inmetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline"
        >
          INMET
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
};
