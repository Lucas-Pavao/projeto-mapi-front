import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { showsExperimentalLabel } from '@/components/risk/risk';
import { useNotices } from '@/hooks/useNotices';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useCreatePoint, usePatchPoint } from '@/features/points/hooks/usePointsAdmin';
import { PointEditDialog } from '@/features/points/components/PointEditDialog';
import { PointCreateDialog } from '@/features/points/components/PointCreateDialog';
import type { FloodPointPatch } from '@/features/points/schemas/point-admin.schema';
import type { FloodPointRequestDTO, FloodPointResponseDTO } from '@/features/map/types';
import { actionErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

export const AdminPointsPage: React.FC = () => {
  const query = useFloodPoints();
  const patch = usePatchPoint();
  const create = useCreatePoint();
  const { notices, notify, dismiss } = useNotices();
  const [editing, setEditing] = useState<FloodPointResponseDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  const save = (body: FloodPointPatch) => {
    if (!editing) return;
    setFormError(null);
    patch.mutate({ slug: editing.slug, body }, {
      onSuccess: () => { notify('success', 'Ponto atualizado.'); setEditing(null); },
      onError: (e) => setFormError(actionErrorMessage(e, 'salvar o ponto')),
    });
  };
  const toggleActive = (p: FloodPointResponseDTO) => {
    setTogglingSlug(p.slug);
    patch.mutate({ slug: p.slug, body: { active: !p.active } }, {
      onSuccess: () => notify('success', p.active ? `${p.name} desativado.` : `${p.name} ativado.`),
      onError: (e) => notify('error', actionErrorMessage(e, 'alterar o ponto')),
      onSettled: () => setTogglingSlug(null),
    });
  };
  const doCreate = (body: FloodPointRequestDTO) => {
    setFormError(null);
    create.mutate(body, {
      onSuccess: () => { notify('success', 'Ponto criado.'); setCreating(false); },
      onError: (e) => setFormError(actionErrorMessage(e, 'criar o ponto')),
    });
  };

  return (
    <PageShell
      title="Pontos"
      description="Pontos críticos cadastrados. Edite coordenadas, estações e limiar; desativar tira o ponto do ciclo de previsão."
      actions={<Button type="button" className="h-11 gap-1.5 px-4 md:h-8" onClick={() => { setFormError(null); setCreating(true); }}><Plus className="size-4" aria-hidden="true" /> Novo ponto</Button>}
    >
      <QueryState query={query} what="os pontos" emptyTitle="Nenhum ponto cadastrado." emptyHint="Crie o primeiro ponto crítico.">
        {(points) => (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-label="Pontos críticos">
            {points.map((p) => (
              <li key={p.id} data-slug={p.slug} data-active={p.active} className={cn('flex flex-col gap-2 rounded-xl border bg-card p-4', p.active ? 'border-border' : 'border-dashed border-border opacity-80')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/pontos/${p.slug}`} className="text-body-strong text-foreground hover:underline">{p.name}</Link>
                    <p className="text-caption text-muted-foreground">{p.municipality ?? 'Município não informado'} · <span className="text-code">{p.slug}</span></p>
                  </div>
                  {p.active ? <RiskBadge level={p.floodPrediction?.riskLevel} probability={p.floodPrediction?.floodProbability} /> : <span className="rounded-md bg-muted px-2 py-1 text-2xs font-bold text-muted-foreground">Inativo</span>}
                </div>
                {p.active && showsExperimentalLabel(p.floodPrediction) && <ExperimentalBadge className="w-fit" />}
                <p className="text-caption text-muted-foreground">
                  <span className="text-code">{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</span>
                  {' · estações: '}
                  <span className="text-code">{[...(p.sensorConfig?.pluviometerStationIds ?? []), ...(p.sensorConfig?.riverLevelStationIds ?? [])].join(', ') || 'nenhuma'}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" className="h-11 gap-1.5 px-3 md:h-8" onClick={() => { setFormError(null); setEditing(p); }} aria-label={`Editar ${p.name}`}><Pencil className="size-4" aria-hidden="true" /> Editar</Button>
                  <label className="flex min-h-11 items-center gap-2 text-body text-foreground">
                    <input type="checkbox" role="switch" checked={p.active} disabled={togglingSlug === p.slug} onChange={() => toggleActive(p)} className="size-4" aria-label={`${p.name}: ponto ativo`} />
                    {p.active ? 'Ativo' : 'Inativo'}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      {editing && <PointEditDialog key={editing.slug} point={editing} saving={patch.isPending} error={formError} onSave={save} onClose={() => setEditing(null)} />}
      {creating && <PointCreateDialog saving={create.isPending} error={formError} onSave={doCreate} onClose={() => setCreating(false)} />}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageShell>
  );
};
export default AdminPointsPage;
