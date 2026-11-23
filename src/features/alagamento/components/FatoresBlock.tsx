import React from 'react';
import { OnlyInDetail } from '@/lib/detailMode';
import { cn } from '@/lib/utils';
import type { FloodFactors } from '../schemas/alagamento.schema';

type Refluxo = NonNullable<FloodFactors['refluxo']>;
type Limpeza = NonNullable<FloodFactors['limpeza']>;

/** Selo do papel do fator no alerta: entra na conta ou só aparece aqui. */
const RoleTag: React.FC<{ applied: boolean; status: string }> = ({ applied, status }) => {
  const label = status !== 'OK' ? (status === 'SEM_DADO' ? 'sem dado' : status === 'NAO_SE_APLICA' ? 'não se aplica' : 'desligado')
    : applied ? 'muda o nível' : 'só informa';
  return (
    <span data-testid="fator-papel" className={cn('rounded-full border px-2 py-px text-[10px] font-bold leading-[14px]',
      status !== 'OK' ? 'border-dashed border-border text-muted-foreground' : applied ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>
      {label}
    </span>
  );
};

const Row: React.FC<{ title: string; testid: string; applied: boolean; status: string; text: string; children?: React.ReactNode }> = ({ title, testid, applied, status, text, children }) => (
  <li data-testid={testid} data-status={status} className="flex flex-col gap-1 rounded-lg border border-border px-2.5 py-2">
    <span className="flex items-center justify-between gap-2 text-[13px] font-bold leading-[18px]">{title}<RoleTag applied={applied} status={status} /></span>
    <span className="text-[13px] leading-[18px]">{text}</span>
    {children}
  </li>
);

const LEVEL_WORD: Record<string, string> = { ALERTA: 'alerta', ATENCAO: 'atenção', SEM_ALERTA: 'sem alerta', SEM_DADO: 'sem dado' };
const levelWord = (v: string | null | undefined) => (v ? LEVEL_WORD[v] ?? v : '—');

const m2 = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(100 * v).toLocaleString('pt-BR')}%`);

/**
 * Maré e limpeza no alerta único (ADR 0030). Cada fator diz em linguagem simples o que fez e se entrou no nível.
 * Sem dado aparece escrito com o motivo, nunca como "sem efeito".
 */
export const FatoresBlock: React.FC<{ factors: FloodFactors | null | undefined }> = ({ factors }) => {
  if (!factors || (!factors.refluxo && !factors.limpeza)) {
    return <p className="m-0 text-xs text-muted-foreground">maré e limpeza não vieram neste ciclo</p>;
  }
  const r: Refluxo | null | undefined = factors.refluxo;
  const l: Limpeza | null | undefined = factors.limpeza;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {r && (
        <Row title="Maré" testid="fator-mare" applied={r.appliedToLevel} status={r.status}
          text={r.text ?? (r.status === 'SEM_DADO' ? 'maré prevista indisponível' : 'maré não considerada')}>
          {r.status === 'OK' && (
            <OnlyInDetail>
              <span data-testid="fator-mare-detalhe" className="font-mono text-[11px] leading-[15px] text-muted-foreground">
                maré agora {m2(r.tideNowNrM)} m · máx. em 6 h {m2(r.tideMaxHorizonNrM)} m · soleira {m2(r.sillNrM)} m (NR)
                {r.biasScenario ? ` · com o viés do MDT (${m2(r.biasScenario.mdtBiasM)} m) o nível seria ${levelWord(r.biasScenario.level)}` : ''}
              </span>
            </OnlyInDetail>
          )}
        </Row>
      )}
      {l && (
        <Row title="Limpeza da galeria" testid="fator-limpeza" applied={l.appliedToLevel} status={l.status}
          text={l.text ?? 'sem dado de limpeza para este ponto'}>
          {l.status === 'OK' && (
            <OnlyInDetail>
              <span data-testid="fator-limpeza-detalhe" className="font-mono text-[11px] leading-[15px] text-muted-foreground">
                chance de entupida {pct(l.pClogged)} · capacidade entupida {pct(l.fClogged)} da de projeto (sem fonte)
                {l.mixtureLevel ? ` · pela mistura o nível seria ${levelWord(l.mixtureLevel)}` : ''}
              </span>
            </OnlyInDetail>
          )}
        </Row>
      )}
    </ul>
  );
};
