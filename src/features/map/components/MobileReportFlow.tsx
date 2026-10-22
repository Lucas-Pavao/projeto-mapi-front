import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, X } from 'lucide-react';
import { Map, MapCircle } from '@/components/ui/map';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { WATER_DEPTH_LABEL } from '@/features/reports/utils/labels';
import type { FloodReport, WaterDepth } from '@/features/reports/schemas/report.schema';
import { actionErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/hooks/useTheme';
import { useTokenColor } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import type { ReportFormValues } from './ReportFloodModal';
import type { FloodPointResponseDTO } from '../types';
import { formatDistance, nearestTo } from '../utils/geo';

interface Position {
  lat: number;
  lng: number;
  /** Precisão em metros; ausente quando a posição é a do ponto crítico. */
  accuracy: number | null;
}

interface Props {
  /** Ponto crítico de onde o relato partiu: serve de posição se o aparelho não informar a localização. */
  fallbackPoint?: FloodPointResponseDTO;
  points: FloodPointResponseDTO[];
  send: (target: { lat: number; lng: number }, v: ReportFormValues) => Promise<FloodReport>;
  onClose: () => void;
}

type Gps = 'locating' | 'ok' | 'error';
const DEPTHS = Object.keys(WATER_DEPTH_LABEL) as WaterDepth[];
const choice = (on: boolean) => cn('border-2 text-foreground', on ? 'border-primary bg-primary/10' : 'border-input bg-transparent');

/**
 * Relato de alagamento no celular em etapas (MobileRelato.dc.html): onde, está alagado e até onde, descrição, enviado.
 * Envia POST /api/reports (nasce PENDING e cai na fila do operador). Não há foto: a API não recebe imagem.
 */
export const MobileReportFlow: React.FC<Props> = ({ fallbackPoint, points, send, onClose }) => {
  const { theme } = useTheme();
  const primary = useTokenColor('--primary', '#5cb8ff');
  const [step, setStep] = useState(1);
  const [gps, setGps] = useState<Gps>('locating');
  const [pos, setPos] = useState<Position | null>(null);
  const [flooded, setFlooded] = useState<boolean | null>(null);
  const [depth, setDepth] = useState<WaterDepth | null>(null);
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (step !== 1) return;
    let alive = true;
    // Marca "localizando" depois do primeiro quadro, sem setState síncrono no efeito.
    queueMicrotask(() => alive && setGps('locating'));
    if (!navigator.geolocation) {
      queueMicrotask(() => alive && setGps('error'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => alive && (setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }), setGps('ok')),
      () => alive && (setGps('error'), fallbackPoint && setPos({ lat: fallbackPoint.latitude, lng: fallbackPoint.longitude, accuracy: null })),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
    return () => {
      alive = false;
    };
  }, [step, attempt, fallbackPoint]);

  const near = pos ? nearestTo(pos, points) : null;
  const where = !pos ? null : pos.accuracy == null && fallbackPoint ? `Local do ponto ${fallbackPoint.name}` : near && near.distanceM <= 3000 ? `Perto de ${near.item.name} · ${formatDistance(near.distanceM)}` : `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
  const canNext = step === 1 ? pos !== null : true;
  const accR = pos?.accuracy ?? 30;

  const reset = () => {
    setStep(1); setFlooded(null); setDepth(null); setDesc(''); setErr(false); setSendError(null); setProtocol(null); setAttempt((a) => a + 1);
  };

  const submit = useCallback(async () => {
    if (!pos) return;
    setSending(true);
    setSendError(null);
    const text = [flooded === false ? 'Rua seca no momento do relato.' : '', desc.trim()].filter(Boolean).join(' ');
    try {
      const r = await send(pos, { waterDepth: flooded ? depth : null, description: text || null });
      setProtocol(r.id);
      setStep(4);
    } catch (e) {
      setSendError(actionErrorMessage(e, 'enviar o relato'));
    } finally {
      setSending(false);
    }
  }, [pos, flooded, depth, desc, send]);

  const next = () => {
    if (step === 2 && !(flooded === false || (flooded === true && depth != null))) return setErr(true);
    if (step === 3) return void submit();
    setStep((s) => s + 1);
  };
  const back = () => {
    setErr(false);
    setStep((s) => Math.max(1, s - 1));
  };

  const nextText = sending ? 'Enviando…' : step === 3 ? 'Enviar relato' : step === 1 && !pos ? (gps === 'locating' ? 'Localizando…' : 'Sem localização') : 'Continuar';
  const nextDisabled = sending || !canNext;
  const h1 = 'm-0 text-2xl leading-[30px] font-extrabold';
  const gpsDot = gps === 'ok' ? 'bg-success' : gps === 'locating' ? 'live-dot bg-warning' : 'bg-destructive';
  const gpsText = gps === 'ok' ? where : gps === 'locating' ? 'Obtendo localização…' : pos ? `Sem localização do aparelho. ${where}` : 'Não foi possível obter sua localização. Libere o acesso nas configurações do navegador.';

  return (
    <ModalDialog label="Reportar alagamento" onClose={onClose} className="fixed inset-0 z-[90] flex flex-col bg-background text-foreground">
      <header className="flex h-16 flex-none items-center gap-2 border-b border-border bg-card px-3">
        {step > 1 && step < 4 ? (
          <button type="button" onClick={back} aria-label="Voltar" className="flex size-11 items-center justify-center rounded-[10px]"><ChevronLeft className="size-5" aria-hidden="true" /></button>
        ) : (
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-[10px]"><X className="size-5" aria-hidden="true" /></button>
        )}
        <span className="flex-1 text-[17px] font-extrabold">Reportar alagamento</span>
        <span className="font-mono text-xs text-muted-foreground">{step < 4 ? `${step}/3` : 'pronto'}</span>
      </header>
      <div aria-hidden="true" className="grid flex-none grid-cols-4 gap-1 px-4 pt-2.5">
        {[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1 rounded-full', i <= step ? 'bg-primary' : 'bg-border')} />)}
      </div>

      <div className="scroll flex min-h-0 flex-1 flex-col gap-4 px-[18px] pt-[18px]">
        {step === 1 && (
          <>
            <h1 className={h1}>Onde está alagado?</h1>
            <div className="relative h-[300px] flex-none overflow-hidden rounded-2xl border border-border">
              {pos ? (
                <Map key={`${pos.lat},${pos.lng}`} theme={theme} center={[pos.lng, pos.lat]} zoom={16} interactive={false}>
                  <MapCircle center={[pos.lng, pos.lat]} radiusKm={accR / 1000} color={primary} opacity={0.18} strokeColor={primary} strokeWidth={1.5} strokeOpacity={1} />
                </Map>
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">{gps === 'locating' ? 'Obtendo localização…' : 'Mapa indisponível sem localização'}</div>
              )}
              {pos && <span aria-hidden="true" className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 size-5 rounded-full border-4 border-card bg-primary" />}
            </div>
            <div role="status" className="flex items-center gap-2.5 rounded-xl bg-muted p-3 text-sm">
              <span aria-hidden="true" className={cn('size-2.5 flex-none rounded-full', gpsDot)} />
              <span className="flex-1">{gpsText}</span>
              {pos?.accuracy != null && <span className="font-mono text-xs text-muted-foreground">±{Math.round(pos.accuracy)} m</span>}
            </div>
            {gps === 'error' && (
              <button type="button" onClick={() => setAttempt((a) => a + 1)} className="h-11 rounded-xl border border-input text-[15px] font-bold">Tentar de novo</button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={h1}>A região onde você está se encontra alagada agora?</h1>
            <div role="radiogroup" aria-label="Situação do local" className="flex flex-col gap-2.5">
              {([[true, 'Sim, está alagada'], [false, 'Não, está seca']] as const).map(([val, label]) => {
                const on = flooded === val;
                return (
                  <button key={label} type="button" role="radio" aria-checked={on} onClick={() => { setFlooded(val); setErr(false); if (!val) setDepth(null); }} className={cn('flex h-16 items-center gap-3 rounded-[14px] px-4 text-left text-[17px] font-extrabold', choice(on))}>
                    <span className={cn('box-border flex size-[22px] items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-input')}>
                      <span className={cn('size-2.5 rounded-full', on ? 'bg-primary' : 'bg-transparent')} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
            {flooded === true && (
              <>
                <span id="depth-label" className="text-[15px] font-extrabold">Até onde vai a água?</span>
                <div role="group" aria-labelledby="depth-label" className="grid grid-cols-2 gap-2">
                  {DEPTHS.map((d) => (
                    <button key={d} type="button" aria-pressed={depth === d} onClick={() => { setDepth(d); setErr(false); }} className={cn('min-h-14 rounded-xl px-2 text-[15px] font-bold', choice(depth === d))}>
                      {WATER_DEPTH_LABEL[d]}
                    </button>
                  ))}
                </div>
              </>
            )}
            {err && <p role="alert" className="m-0 text-sm font-bold text-destructive">Escolha uma opção para continuar.</p>}
          </>
        )}

        {step === 3 && (
          <>
            <h1 className={h1}>Quer contar o que viu?</h1>
            <label className="flex flex-col gap-1.5">
              <span className="text-[15px] font-extrabold">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></span>
              <textarea
                rows={4}
                value={desc}
                maxLength={1000}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ex.: água entrando nas casas, carro parado"
                className="box-border w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-base leading-[22px] text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <p className="m-0 text-xs leading-[17px] text-muted-foreground">Seu relato vai para a fila de um operador conferir. Ele não vira alerta nem muda a previsão sozinho.</p>
            {sendError && <p role="alert" className="m-0 text-sm font-bold text-destructive">{sendError}</p>}
          </>
        )}

        {step === 4 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3.5 pb-[60px] text-center">
            <span className="flex size-[72px] items-center justify-center rounded-full bg-success/20 text-success"><Check className="size-9" strokeWidth={2.5} aria-hidden="true" /></span>
            <h1 className="m-0 text-[26px] leading-8 font-extrabold">Relato enviado</h1>
            <p role="status" className="m-0 text-[15px] leading-[22px] text-muted-foreground">
              Obrigado por ajudar. Um operador vai conferir. Protocolo <strong className="font-mono text-foreground">#{protocol}</strong>.
            </p>
            <div className="w-full rounded-xl bg-muted p-3 text-left text-[13px] leading-[19px]">
              <strong>{flooded ? `Alagado · ${depth ? WATER_DEPTH_LABEL[depth] : 'altura não informada'}` : 'Rua seca'}</strong>
              <br />
              {where}{desc.trim() ? ` · “${desc.trim()}”` : ''}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-none flex-col gap-2 px-[18px] pb-6 pt-4">
        {step < 4 ? (
          <button type="button" onClick={next} disabled={nextDisabled} className="h-[54px] rounded-xl bg-primary text-base font-extrabold text-primary-foreground disabled:opacity-60">{nextText}</button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="h-[54px] rounded-xl bg-primary text-base font-extrabold text-primary-foreground">Voltar ao mapa</button>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-input bg-transparent text-[15px] font-bold text-foreground">Fazer outro relato</button>
          </>
        )}
      </div>
    </ModalDialog>
  );
};
