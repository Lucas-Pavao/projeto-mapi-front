# Progresso — projeto-mapi-front

O estado completo da revisão fica em `projeto-mapi-api/.claude/mapi/PROGRESSO.md`. Aqui ficam só as etapas executadas neste repositório.

| ID | Tarefa | Status | Branch | Notas |
|---|---|---|---|---|
| IN1165-FRONT-0F | Chuva medida de 3 h no mapa, medido × reanálise, sem dado ≠ zero, citação, sem duplicata | concluido | `feat/in1165-etapa0f` | 2026-11-15 · handoff `docs/handoff/etapa0f.json`; verificado com dado real no Chrome (login do Lucas); 2 defeitos visuais achados e corrigidos (detalhe cortado no topo, chip da legenda quebrando) · vitest 423/423 em 4 de 5 rodadas, 1 falha intermitente não identificada |
| IN1165-FRONT-8 | Faixa com o limiar que a produziu, aviso de sintético visível, 3 maiores contribuições SHAP em unidade física | concluido | `feat/in1165-etapa8` | 2026-11-15 · `PredictionProvenance` no popup, no cartão de detalhe e na folha do celular; schemas e stream aceitam os campos novos; vitest 429/429 |
| NC-FRONT | Novos cenários: riskOf/pctTxt/escala raiz, ponto com limiares e candidatas (B3), sensores canônicos (B1/B2), legenda e celular por limiares, dados com PED e grade (B4), /modelo xgb_v2 × F1, /chuva | concluido | `feat/novos-cenarios` | 2026-11-15 · contrato `docs/redesign/CONTRATO-novos-cenarios.md`; limiar 0,5/0,8 removido; B1–B4 em mocks (msw) até o merge do backend |
| NC-FRONT-2 | Cards do mapa: StationCard (B6, 8 estados), RiverCard, PointCard (5), AnalysisPanel (3 abas), LocationCard (B7, 5) e gerenciador um-por-vez com URL ?ponto&aba e ?local | concluido | `feat/novos-cenarios` | 2026-11-16 · B6/B7 em mocks msw até o backend; celular mantém MobilePointSheet para o resumo do ponto |

| P16-FRONT | Plano de 16/11: fonte parada na tela Dados, C2 (horizonte, entradas ausentes, UNKNOWN), v2 × v3, lista Sensores unificada, login no reinício; chuva prevista ao lado da medida nos cartões do ponto; aba "Previsão de chuva" na tela Modelo | concluido | `feat/modelo-v3` | 2026-11-16 · commits 8d360da a 617e4ec; vitest 548/548; prevista sempre como faixa entre quantis e com texto "estimativa, não medição" |
## Decisões
| Data | Decisão | Quem |
|---|---|---|
| 2026-11-15 | Marcador da chuva medida quadrado (o sensor é redondo); "sem dado" tracejado e sem gota; zero com borda neutra | Claude (autonomia da revisão) |
| 2026-11-15 | Com a camada ligada, o pluviômetro ao vivo que é apelido de uma canônica sai do mapa; os apelidos aparecem só no detalhe | Claude (prompt IN1165, item 5) |
| 2026-11-15 | Camada ligada por padrão; a etiqueta "modelo" marca o acumulado do Open-Meteo no cartão de local | Claude (autonomia da revisão) |
| 2026-11-15 | A etiqueta de sintético vai junto no stream (applyPredictionToPoint) | a previsão nova substitui a anterior; sem copiar, o aviso sumiria na atualização ao vivo | Claude |
| ALERTA-E1-FRONT | 10 | Front | Opus 5.5 | Cartão do ponto com abas Alerta e Experimental, estados do alerta, etiqueta do modelo físico, modo sombra, SSE `alert-state` | concluido (sem push/PR) | `alerta-20min` | 2026-11-17 · `docs/handoff/alerta-etapa1.json`; vitest 569 passed, build ok; `.claude/**` fora da descoberta do vitest (as 23 falhas da suíte sem filtro eram de cópias em worktrees); `/version.json` com o commit |
