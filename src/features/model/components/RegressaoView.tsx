import React from 'react';
import { InfoTip } from '@/components/InfoTip';
import { OnlyInDetail } from '@/lib/detailMode';
import { cn } from '@/lib/utils';
import type { RegressaoCard } from '../schemas/regressaoCard.schema';

const pct = (x: number) => `${Math.round(100 * x)}%`;
const SLUG_NAME: Record<string, string> = {
  AV_RECIFE_IBURA: 'Av. Recife · Ibura', CIN_UFPE: 'CIn · UFPE', AGAMENON_DERBY: 'Agamenon · Derby',
  MASCARENHAS_IMBIRIBEIRA: 'Mascarenhas · Imbiribeira', JABOATAO_CENTRO: 'Jaboatão · Centro',
};

const Section: React.FC<{ title: string; info: string; children: React.ReactNode; className?: string }> = ({ title, info, children, className }) => (
  <section className={cn('flex flex-col gap-3 rounded-2xl border border-border bg-card p-4', className)}>
    <h2 className="m-0 flex items-center gap-1.5 text-[15px] font-extrabold">{title}<InfoTip text={info} /></h2>
    {children}
  </section>
);

const KIND_CLASS: Record<string, string> = {
  dado: 'border-border text-muted-foreground', validado: 'border-success/60 text-success',
  'físico, não calibrado': 'border-warning/60 text-warning', 'fixada antes do teste': 'border-primary/60 text-primary',
};

/** Aba "Alagamento por regressão" da tela Modelo (5.7). Enxuta: explicações nos ⓘ; método por extenso só em Detalhes. */
export const RegressaoView: React.FC<{ card: RegressaoCard }> = ({ card }) => (
  <div className="flex flex-col gap-4">
    <p data-testid="regressao-banner" className="m-0 flex items-center gap-2 rounded-xl border border-warning/50 bg-warning/10 px-3 py-2 text-[13px] font-bold text-warning">
      Experimental · nenhum modelo aprende com rótulo de alagamento
      <InfoTip text="Proposta de 20/11, experimental: os rótulos saem do treino. A previsão passa a ser a chuva medida prevista pelo rain_v1, passada pelo balde do ponto, com uma regra fixa de 15 cm. O classificador anterior (rótulo sintético) saiu do serviço." />
    </p>

    <Section title="Caminho" info={`${card.rule} Cada bloco diz o estado dele: dado medido, modelo validado, física sem calibração e regra fixada antes do teste.`}>
      <ol data-testid="pipeline" className="m-0 grid list-none gap-2 p-0 sm:grid-cols-4">
        {card.pipeline.map((b, i) => (
          <li key={b.step} className="flex flex-col gap-1 rounded-xl bg-muted p-3">
            <span className="text-[11px] text-muted-foreground">{i + 1}</span>
            <span className="text-sm font-extrabold">{b.step}</span>
            <span className={cn('self-start rounded-md border px-1.5 text-[11px] font-bold', KIND_CLASS[b.kind] ?? 'border-border')}>{b.kind}</span>
            <OnlyInDetail><span className="text-xs text-muted-foreground">{b.detail}</span></OnlyInDetail>
          </li>
        ))}
      </ol>
    </Section>

    <Section title="Validação" info={`${card.smallSampleNote} IC 95% exato (Clopper-Pearson) com o dia como unidade. ${card.finding}`}>
      {card.neverFired && <p data-testid="never-fired" className="m-0 rounded-lg border border-dashed border-warning px-3 py-2 text-[13px] font-bold">Em 5 anos, o alerta nunca disparou nos 4 pontos com terreno.</p>}
      <table className="w-full text-left text-[13px]">
        <thead className="text-xs text-muted-foreground"><tr><th scope="col" className="py-1 font-normal">Item</th><th scope="col" className="font-normal">Resultado</th><th scope="col" className="font-normal">IC 95%</th><th scope="col" className="font-normal">Estado</th></tr></thead>
        <tbody>
          {card.validation.map((v) => (
            <tr key={v.id} data-testid={`val-${v.id}`} className="border-t border-border align-top">
              <td className="py-1.5 pr-2"><span className="font-mono text-muted-foreground">{v.id}</span> {v.item}</td>
              <td className="pr-2 font-mono">{v.result}</td>
              <td className="pr-2 font-mono">{v.ci ? `${pct(v.ci[0])}–${pct(v.ci[1])}` : '—'}</td>
              <td className="text-xs text-muted-foreground">{v.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p data-testid="small-sample" className="m-0 text-[13px] font-bold">{card.smallSampleNote}</p>
      <OnlyInDetail><p className="m-0 text-xs text-muted-foreground">{card.finding}</p></OnlyInDetail>
    </Section>

    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Aviso de chuva forte do rain_v1" info="Eventos FORTE (≥ 25,15 mm/h) do teste (28 eventos): quantos o aviso pegou, a antecedência mediana e os falsos por evento. O aviso de 1 h só chega com a chuva já caindo.">
        <table data-testid="rain-warning" className="w-full text-left text-[13px]">
          <thead className="text-xs text-muted-foreground"><tr><th scope="col" className="font-normal">Prazo</th><th scope="col" className="font-normal">Avisados</th><th scope="col" className="font-normal">Antecedência</th><th scope="col" className="font-normal">Falsos/evento</th></tr></thead>
          <tbody className="font-mono">
            {card.rainWarning.map((r) => (
              <tr key={r.horizonHours} className="border-t border-border">
                <td className="py-1">{r.horizonHours} h</td><td>{r.detected}/{r.events}</td><td>{r.leadMedianMin} min</td><td>{r.falsePerEvent.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {card.rainWarning.find((r) => r.horizonHours === 1)?.warnedBeforeRainPct === 0 && <p className="m-0 text-[13px]">Nenhum aviso de 1 h antes de começar a chover.</p>}
      </Section>
      <Section title="Balde a 10 min em 5 anos" info="Eventos com lâmina ≥ 15 cm na chuva medida de 5 anos, por período de retorno da galeria. Sem calibração: o balde quase não dispara com os parâmetros atuais.">
        <table data-testid="bucket-5y" className="w-full text-left text-[13px]">
          <thead className="text-xs text-muted-foreground"><tr><th scope="col" className="font-normal">Ponto</th><th scope="col" className="font-normal">TR2</th><th scope="col" className="font-normal">TR5</th><th scope="col" className="font-normal">TR10</th></tr></thead>
          <tbody className="font-mono">
            {card.bucket5y.map((b) => (
              <tr key={b.slug} className="border-t border-border">
                <td className="py-1 font-sans">{SLUG_NAME[b.slug] ?? b.slug}</td>
                {b.noTerrain ? <td colSpan={3} className="font-sans text-muted-foreground">sem terreno</td> : <><td>{b.tr2}{b.dates?.length ? ` (${b.dates.join(', ')})` : ''}</td><td>{b.tr5}</td><td>{b.tr10}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 text-[13px]">O balde quase não dispara com os parâmetros atuais.</p>
      </Section>
    </div>
    <OnlyInDetail>
      <p className="m-0 text-xs text-muted-foreground">Fontes: {card.sources.join(' · ')} · {card.version} · {card.attribution}</p>
    </OnlyInDetail>
  </div>
);
