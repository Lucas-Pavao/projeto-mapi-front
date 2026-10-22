# Primitivos de fidelidade ao protótipo

Criados pelo agente A (shell + mapa) para as outras telas importarem.

| Primitivo | Arquivo | Uso |
| --- | --- | --- |
| `Panel` | `ui/panel.tsx` | Cartão do protótipo: `bg-card`, borda, `rounded-2xl`, `shadow-elevation-overlay`. Prop `as` (`div`, `section`, `aside`, `article`). Sem padding. |
| `SectionLabel` | `ui/section-label.tsx` | Rótulo de seção em caixa alta (12 px, 700, 0,06 em, `muted-foreground`). Prop `as` (`h2` padrão). |

## Layout de página

- A casca (`AppLayout`) tem a barra de navegação com 60 px e `<main class="relative">` logo abaixo.
- Painéis flutuantes ficam em `absolute` a **16 px** das bordas de `<main>` (`top-4 left-4 bottom-4 right-4`), o que dá **76 px** a partir do topo da janela. Estenda até `bottom-4` (a barra de simulação F6 não existe).
- Largura do painel esquerdo do mapa: 360 px. Do direito: 300 px.
- Telas de conteúdo (não mapa) rolam dentro de `<main>`; use `Panel` com `p-4` para os cartões.

## Risco

- `RiskBadge` (pill: `h-6 px-2.5`, ícone 14 px; marker: 32 px, borda 2 px), `ExperimentalBadge`, `RiskLegend` (agora cartão fixo, props `className` e `showExperimentalNote`) e `RiskCountTiles` (quatro blocos de contagem) seguem o protótipo.
- Tokens de cor: `text-risk-*-text` para texto/porcentagem sobre superfície; `border-t-risk-*` para o filete dos blocos.
