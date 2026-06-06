# Gemini CLI Context: Projeto Mapi Front

Este repositório contém o frontend da plataforma MAPI, focada no monitoramento em tempo real de sensores e visualização de dados geoespaciais (riscos de inundação, marés, meteorologia).

---

## 🚀 Tecnologias Core

- **Framework:** React 19 (Uso intensivo de hooks e novas APIs de transição).
- **Build Tool:** Vite 8.
- **Linguagem:** TypeScript (Tipagem estrita obrigatória).
- **Estilização:** Tailwind CSS 4 & Shadcn UI.
- **Maps:** MapLibre GL com CartoDB Basemaps.
- **Roteamento:** React Router 7.

---

## 🏗️ Arquitetura (Feature-Based)

O projeto utiliza uma **Arquitetura Baseada em Funcionalidades**. Toda lógica de domínio deve ser isolada em `src/features/`.

- `src/features/[feature-name]/`:
  - `components/`: Componentes exclusivos da funcionalidade.
  - `hooks/`: Hooks customizados para lógica de estado ou efeitos.
  - `services/`: Camada de abstração para chamadas à API (Axios).
  - `types/`: Definições TypeScript específicas do domínio.
  - `utils/`: Funções utilitárias locais.

### Funcionalidades Atuais:
- **authentication:** Gerenciamento de sessão e JWT.
- **map:** Visualização principal, camadas de sensores e alertas de inundação.

---

## 🛠️ Convenções de Desenvolvimento

### 1. Padrões de Código
- **Componentes:** Funcionais com exportação nomeada.
- **Tipagem:** Proibido o uso de `any`. Utilize interfaces claras para Props e Payloads de API.
- **Estilização:** Use o utilitário `cn` (`src/lib/utils.ts`) para merge de classes Tailwind condicionais.

### 2. Integração com API
- Todas as chamadas devem usar a base URL `import.meta.env.VITE_API_URL`.
- Serviços devem ser os únicos locais onde o `axios` é instanciado ou configurado.

### 3. Performance no Mapa
- **Memoização:** Use `useMemo` e `useCallback` rigorosamente em componentes que interagem com o `MapLibre GL`.
- **Cleanup:** Sempre implemente a remoção de fontes e camadas no retorno do `useEffect`.

---

## 🤖 Operação com IA

Para garantir a integridade do código e aderência aos padrões arquiteturais, todos os agentes de IA devem consultar e seguir o manual de operação detalhado:

👉 **[AGENTS.md](./AGENTS.md)**

---

## 📦 Comandos Úteis

- `npm run dev`: Inicia o ambiente de desenvolvimento.
- `npm run build`: Compila o projeto para produção (TypeScript + Vite).
- `npm run lint`: Executa a verificação estática de código.
- `npm run preview`: Visualiza o build de produção localmente.
