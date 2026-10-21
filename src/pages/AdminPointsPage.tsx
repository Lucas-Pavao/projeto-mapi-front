import React, { useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { useNotices } from '@/hooks/useNotices';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useCreatePoint, usePatchPoint } from '@/features/points/hooks/usePointsAdmin';
import { PointList } from '@/features/points/components/PointList';
import { PointEditor, type EditorMode } from '@/features/points/components/PointEditor';
import type { FloodPointPatch } from '@/features/points/schemas/point-admin.schema';
import type { FloodPointRequestDTO, FloodPointResponseDTO } from '@/features/map/types';
import { actionErrorMessage } from '@/lib/apiError';

export const AdminPointsPage: React.FC = () => {
  const query = useFloodPoints();
  const patch = usePatchPoint();
  const create = useCreatePoint();
  const { notices, notify, dismiss } = useNotices();
  const [picked, setPicked] = useState<string | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  // Nova versão do formulário a cada limpar/criar, para recomeçar do estado do servidor.
  const [version, setVersion] = useState(0);

  const points = query.data ?? [];
  const selected: FloodPointResponseDTO | undefined = picked === 'new' ? undefined : (points.find((p) => p.slug === picked) ?? points[0]);
  const mode: EditorMode = picked === 'new' || !selected ? { kind: 'create' } : { kind: 'edit', point: selected };

  const pick = (slug: string | 'new') => { setPicked(slug); setFormError(null); setSaved(false); setVersion((v) => v + 1); };

  const save = (body: FloodPointPatch) => {
    if (mode.kind !== 'edit') return;
    setFormError(null);
    setSaved(false);
    patch.mutate({ slug: mode.point.slug, body }, {
      onSuccess: () => setSaved(true),
      onError: (e) => setFormError(actionErrorMessage(e, 'salvar o ponto')),
    });
  };
  const doCreate = (body: FloodPointRequestDTO) => {
    setFormError(null);
    setSaved(false);
    create.mutate(body, {
      onSuccess: (p) => { setPicked(p.slug); setVersion((v) => v + 1); setSaved(true); },
      onError: (e) => setFormError(actionErrorMessage(e, 'criar o ponto')),
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

  const activeCount = points.filter((p) => p.active).length;
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full lg:flex-row">
      <section aria-label="Pontos cadastrados" className="flex min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-0 lg:w-[560px] lg:shrink-0">
        <div className="flex items-center gap-3 border-b border-border px-[18px] py-4">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Pontos críticos</h1>
            <p className="m-0 text-xs text-muted-foreground">GET /api/pontos · {points.length} cadastrados · {activeCount} ativos no ciclo de previsão</p>
          </div>
          <Button type="button" className="h-11 px-3 md:h-9" onClick={() => pick('new')}>Novo ponto</Button>
        </div>
        <QueryState query={query} what="os pontos" emptyTitle="Nenhum ponto cadastrado." emptyHint="Crie o primeiro ponto crítico.">
          {(list) => <PointList points={list} selectedSlug={mode.kind === 'edit' ? mode.point.slug : null} togglingSlug={togglingSlug} onSelect={(p) => pick(p.slug)} onToggle={toggleActive} />}
        </QueryState>
      </section>
      {(query.isSuccess || picked === 'new') && (
        <PointEditor
          key={`${mode.kind === 'edit' ? mode.point.slug : 'novo'}-${version}`}
          mode={mode}
          saving={patch.isPending || create.isPending}
          error={formError}
          saved={saved}
          onSavePatch={save}
          onCreate={doCreate}
          onClear={() => pick(mode.kind === 'edit' ? mode.point.slug : 'new')}
        />
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </div>
  );
};
export default AdminPointsPage;
