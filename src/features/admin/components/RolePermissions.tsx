import React from 'react';
import { cn } from '@/lib/utils';

const COLS = ['CONVID.', 'USER', 'OPER.', 'ADMIN'];
const ARIA = ['convidado', 'usuário', 'operador', 'administrador'];

/** Ação × perfil, na mesma regra de perfil mínimo das telas (ADR 0010). */
const PERMS: Array<[string, [boolean, boolean, boolean, boolean]]> = [
  ['Ver mapa de risco e sensores', [true, true, true, true]],
  ['Enviar relato de alagamento', [true, true, true, true]],
  ['Ver detalhe do ponto e histórico', [false, true, true, true]],
  ['Exportar dados (CSV)', [false, true, true, true]],
  ['Confirmar ou descartar relatos', [false, false, true, true]],
  ['Configurar alertas', [false, false, true, true]],
  ['Cadastrar pontos críticos', [false, false, false, true]],
  ['Rodar ingestão e ver saúde dos dados', [false, false, false, true]],
  ['Gerenciar usuários', [false, false, false, true]],
];

const row = 'grid grid-cols-[1fr_repeat(4,64px)] gap-1.5';

export const RolePermissions: React.FC = () => (
  <section aria-label="Permissões por perfil" className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-[18px] lg:col-span-5">
    <h2 className="m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground">O QUE CADA PERFIL PODE FAZER</h2>
    <div role="table" aria-label="Ações por perfil" className="flex flex-col gap-3">
      <div role="row" className={cn(row, 'text-center text-[11px] font-extrabold text-muted-foreground')}>
        <span role="columnheader" className="text-left">AÇÃO</span>
        {COLS.map((c) => <span key={c} role="columnheader">{c}</span>)}
      </div>
      {PERMS.map(([label, cells]) => (
        <div key={label} role="row" className={cn(row, 'items-center border-b border-border py-1.5 text-[13px]')}>
          <span role="cell">{label}</span>
          {cells.map((v, j) => (
            <span key={j} role="cell" className="flex justify-center">
              <span aria-label={`${ARIA[j]}: ${v ? 'permitido' : 'não permitido'}`} className={cn('flex size-[22px] items-center justify-center rounded-md text-[13px] leading-none font-extrabold', v ? 'bg-success/20 text-success' : 'bg-transparent text-muted-foreground')}>{v ? '✓' : '–'}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
    <p className="mt-auto mb-0 rounded-xl bg-muted p-3 text-xs leading-[17px]"><strong>Segurança:</strong> login com limite de tentativas (LoginRateLimitingFilter), token curto com refresh e logout que invalida o refresh. Convidado não faz login: vê só a página pública &quot;Minha rua&quot;.</p>
  </section>
);
