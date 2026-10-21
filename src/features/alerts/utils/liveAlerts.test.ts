import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { applyLiveAlert } from './liveAlerts';
import { activeAlertSlugs } from './activeAlerts';
import type { Alert, AlertPage } from '../schemas/alert.schema';

const alert = (id: number, over: Partial<Alert> = {}): Alert => ({ id, kind: 'RISK_LEVEL', severity: 'WARNING', title: `a${id}`, triggeredAt: '2026-10-21T12:00:00Z', ...over });
const page = (content: Alert[]): AlertPage => ({ page: 0, size: 20, totalElements: content.length, content });

describe('activeAlertSlugs', () => {
  it('só alertas sem reconhecimento e com ponto', () => {
    const s = activeAlertSlugs([alert(1, { floodPointSlug: 'a' }), alert(2, { floodPointSlug: 'b', acknowledgedAt: '2026-10-21T12:10:00Z' }), alert(3)]);
    expect([...s]).toEqual(['a']);
  });
  it('indefinido vira vazio', () => {
    expect(activeAlertSlugs(undefined).size).toBe(0);
  });
});

describe('applyLiveAlert', () => {
  it('alerta novo entra no topo da lista OPEN', () => {
    const qc = new QueryClient();
    qc.setQueryData(['alerts', 'OPEN', 0, 20], page([alert(1)]));
    applyLiveAlert(qc, alert(2));
    const p = qc.getQueryData<AlertPage>(['alerts', 'OPEN', 0, 20])!;
    expect(p.content.map((a) => a.id)).toEqual([2, 1]);
    expect(p.totalElements).toBe(2);
  });
  it('mesmo id atualiza sem duplicar', () => {
    const qc = new QueryClient();
    qc.setQueryData(['alerts', 'OPEN', 0, 20], page([alert(1)]));
    applyLiveAlert(qc, alert(1, { title: 'novo' }));
    const p = qc.getQueryData<AlertPage>(['alerts', 'OPEN', 0, 20])!;
    expect(p.content).toHaveLength(1);
    expect(p.content[0].title).toBe('novo');
  });
  it('alerta reconhecido sai da lista OPEN', () => {
    const qc = new QueryClient();
    qc.setQueryData(['alerts', 'OPEN', 0, 20], page([alert(1), alert(2)]));
    applyLiveAlert(qc, alert(1, { acknowledgedAt: '2026-10-21T12:30:00Z' }));
    const p = qc.getQueryData<AlertPage>(['alerts', 'OPEN', 0, 20])!;
    expect(p.content.map((a) => a.id)).toEqual([2]);
    expect(p.totalElements).toBe(1);
  });
  it('sem cache da lista não cria nada', () => {
    const qc = new QueryClient();
    applyLiveAlert(qc, alert(1));
    expect(qc.getQueryData(['alerts', 'OPEN', 0, 20])).toBeUndefined();
  });
});
