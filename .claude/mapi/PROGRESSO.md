# Progresso — projeto-mapi-front

O estado completo da revisão fica em `projeto-mapi-api/.claude/mapi/PROGRESSO.md`. Aqui ficam só as etapas executadas neste repositório.

| ID | Tarefa | Status | Branch | Notas |
|---|---|---|---|---|
| IN1165-FRONT-0F | Chuva medida de 3 h no mapa, medido × reanálise, sem dado ≠ zero, citação, sem duplicata | concluido | `feat/in1165-etapa0f` | 2026-11-15 · handoff `docs/handoff/etapa0f.json`; verificado com dado real no Chrome (login do Lucas); 2 defeitos visuais achados e corrigidos (detalhe cortado no topo, chip da legenda quebrando) · vitest 423/423 em 4 de 5 rodadas, 1 falha intermitente não identificada |

## Decisões
| Data | Decisão | Quem |
|---|---|---|
| 2026-11-15 | Marcador da chuva medida quadrado (o sensor é redondo); "sem dado" tracejado e sem gota; zero com borda neutra | Claude (autonomia da revisão) |
| 2026-11-15 | Com a camada ligada, o pluviômetro ao vivo que é apelido de uma canônica sai do mapa; os apelidos aparecem só no detalhe | Claude (prompt IN1165, item 5) |
| 2026-11-15 | Camada ligada por padrão; a etiqueta "modelo" marca o acumulado do Open-Meteo no cartão de local | Claude (autonomia da revisão) |
