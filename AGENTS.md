# 🤖 Manual de Operação para Agentes de IA - MAPI Front

Este documento estabelece as diretrizes arquiteturais, restrições de performance e convenções de código para o desenvolvimento no repositório **MAPI Front**. Qualquer agente de IA gerando código para este projeto deve seguir este manual estritamente.

---

## 🏗️ 1. Padrão Arquitetural (Feature-Based)

Adotamos a **Arquitetura Baseada em Funcionalidades**. Agentes não devem criar componentes genéricos na raiz se eles pertencerem a um domínio específico.

- **Uma feature por tela de domínio:** `authentication`, `map`, `sensors`, `alerts`, `events`, `model`, `reports`, `admin`, `points`, `public-risk` e `live` (stream SSE). Páginas finas ficam em `src/pages/`; componentes compartilhados em `src/components/` (risco em `src/components/risk`).
- **Regra de Ouro:** Se a alteração ou novo recurso for exclusivo da tela de monitoramento, painéis ou interações espaciais, o código **DEVE** ser isolado dentro de `src/features/map/`.
- **Estrutura de uma Feature:** Cada pasta dentro de `features/` deve conter seus próprios subdiretórios `components/`, `hooks/`, `services/`, `schemas/` (zod) e `types/`. Não misture lógica de infraestrutura global com regras de domínio.

---

## ⚡ 2. Restrições de Performance e Ciclo de Vida (React 19)

O mapa base (`MapLibre GL`) faz uso intensivo de renderização acelerada por hardware (WebGL). Lógicas ineficientes no React que quebram o ciclo de renderização causarão travamentos na UI.

### Diretrizes de Performance para IA:
1. **Evite Estados Locais Excessivos no Topo:** Nunca armazene payloads massivos de sensores ou GeoJSONs no estado (`useState`) do componente raiz do mapa, a menos que seja estritamente necessário. Use Contextos específicos ou gerenciadores de estado locais na feature.
2. **Memoização de Callbacks e Seletores:** Sempre que passar funções manipuladoras para o MapLibre ou componentes filhos complexos (como listas de sensores), envolva-as em `useCallback`.
3. **Cálculos Pesados de Dados:** Formatações de séries temporais ou cálculos geométricos complexos feitos no client (como conversões para UTC-3) devem ser envolvidos em `useMemo` com dependências estritas.
4. **Limpeza de Eventos (Cleanup):** Sempre que gerar um hook ou componente que adicione listeners, fontes (`addSource`) ou camadas (`addLayer`) ao MapLibre GL, o agente **DEVE** incluir a lógica de destruição/remoção no retorno do `useEffect` para evitar memory leaks.

---

## 🗺️ 3. Manipulação Geoespacial e MapLibre GL

O ecossistema MAPI lida com dados em tempo real vindos do backend. Ao manipular dados espaciais:
- **Tipagem Estrita:** Sempre utilize e estenda as definições contidas em `src/features/map/types/`. Nunca utilize o tipo `any` para propriedades geométricas ou payloads de sensores.
- **Mutação de Camadas:** Para atualizar a posição ou os dados de um ponto crítico ou sensor no mapa, prefira atualizar a fonte de dados (`map.getSource('id').setData(newData)`) em vez de remover e recriar a camada inteira (`removeLayer` / `addLayer`).

---

## 🔒 4. Padrão de Integração com a API Central (MAPI API)

O frontend consome dados de forma reativa a partir do barramento REST protegido por JWT exposto pelo Backend.
- **Isolamento de Requisições:** Toda chamada HTTP deve passar estritamente pela camada de `services/` da respectiva funcionalidade. Nunca instancie clientes HTTP ou chame o `fetch`/`axios` diretamente de dentro de componentes visuais.
- **Uso de Variáveis de Ambiente:** Todas as requisições devem consumir a URL base injetada por `import.meta.env.VITE_API_URL`. Nunca chumbe IPs ou `localhost` no código.
- **Tratamento de Tipos:** O backend devolve o risco de inundação como String de enum (`LOW`, `MEDIUM`, `HIGH`, `UNKNOWN`). O frontend mapeia esses enums para os tokens `risk-*` (`risk-*`, `on-risk-*`, `risk-*-edge`, `risk-*-text`) por meio dos componentes de `src/components/risk` (`RiskBadge`, `RiskIcon`, `RiskLegend`, `ExperimentalBadge`) e de `getRiskVisual`. Não use variantes shadcn nem cores soltas para risco. Risco sempre com ícone e rótulo; `UNKNOWN` é cinza tracejado, sem porcentagem.
- **Cache de servidor:** TanStack Query é o cliente de cache. Cada tela consome um hook da sua feature (`useQuery`) que chama o `service`; a resposta passa por schema zod (`schemas/`) e o tipo vem de `z.infer`.

---

## 🛠️ 5. Estilização e UI (Tailwind CSS 4 & Shadcn)

- **Utilitários Puros:** Utilize as classes nativas do Tailwind CSS 4 para layouts responsivos e transições suaves de tema (Dark/Light).
- **Primitivos do Shadcn:** Para novos modais, sidebars analíticas e tabelas, use os componentes atômicos expostos em `src/components/ui/`. Se o componente precisar de comportamento customizado, estenda-o sem quebrar a acessibilidade nativa (primitivos `@base-ui/react`, não Radix).

---

## 📝 6. Checklist de Geração de Código (Prompt-Gate)

Antes de entregar qualquer refatoração ou componente para o MAPI Front, valide mentalmente:
- [ ] O código segue o padrão TypeScript estrito e as tipagens batem com o contrato da API?
- [ ] Criei hooks customizados para isolar os efeitos (`useEffect`) e lógicas de busca de dados?
- [ ] Certifiquei-me de que essa alteração não causará re-renderizações infinitas na camada do mapa?
- [ ] A estilização respeita o design adaptativo com suporte a Dark e Light Mode?
