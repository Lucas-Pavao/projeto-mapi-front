# MAPI Front - Dashboard e Visualização Geoespacial 🗺️✨

O **MAPI Front** é a camada de interação com o usuário final do ecossistema MAPI, consistindo em uma aplicação web avançada de visualização geoespacial focada no monitoramento preditivo da Região Metropolitana do Recife.

## 🌐 Ecossistema MAPI

Este projeto é a **ponta de entrega visual** de todo o ecossistema:

```text
  [ Agências (ANA / APAC) ] 📡
        │   (APIs REST/HTTP públicas de estações hidrometeorológicas reais)
        ▼
  [  MAPI API  ] (Java 21 / Spring Boot / TimescaleDB) 🌊🚀
        │ ▲
        │ │ (Dados em Tempo Real via HTTP POST / Resposta com Probabilidade e Risco)
        ▼ │
  [  MAPI AI  ] (Python / FastAPI / XGBoost & LSTM) 🧠
        │
        │ (Consumo da REST API e Exibição Geoespacial)
        ▼
  [ MAPI Front ] (React 19 / MapLibre GL) 💻✨ <-- (Este Serviço)
```

> **Nota de arquitetura:** o antigo componente "MAPI Edge" (processo Python separado que buscava dados da ANA/APAC e os publicava via MQTT) foi descontinuado — a própria MAPI API busca esses dados diretamente, em jobs agendados, eliminando essa camada de infraestrutura. Ver o README da MAPI API para detalhes.

### Componentes do Ecossistema:
- **[MAPI API](https://github.com/Lucas-Pavao/projeto-mapi-api):** Orquestrador central — coleta os dados de sensores diretamente das agências e persiste na base temporal.
- **[MAPI AI](https://github.com/Lucas-Pavao/projeto-mapi-ai):** Microserviço de inferência para predição de riscos de inundação. **Status atual: ainda não está funcional/em produção** — a MAPI API já trata isso com fallback (risco "UNKNOWN") quando a predição não responde.
- **[MAPI Front](https://github.com/Lucas-Pavao/projeto-mapi-front):** Interface geoespacial para monitoramento em tempo real (Este Repositório).

### Relação de Consumo e Fluxo:
- **Consumo do Core REST:** Conecta-se à MAPI API para obter sensores, pontos de monitoramento, dado ambiental (`/api/environmental-data`), maré e históricos.
- **Exibição dos Alertas de IA:** Renderiza visualmente os níveis de alerta (LOW, MEDIUM, HIGH, CRITICAL) obtidos via `/api/flood-predictions`, quando a MAPI AI estiver disponível.

## 🛠️ Tecnologias Escolhidas

| Categoria | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Framework Core** | React 19 | Melhorias de renderização e gerenciamento reativo de estado. |
| **Linguagem** | TypeScript | Tipagem estrita contra quebras de payloads inesperados. |
| **Bundler** | Vite 8 | Build ultra rápido com Hot Module Replacement instantâneo. |
| **Mapas** | MapLibre GL | Renderização vetorial acelerada por WebGL para alta performance. |
| **Estilização** | Tailwind CSS 4 & Shadcn UI | Estilização utilitária combinada com componentes de design system. |

## 📂 Estrutura de Pastas Detalhada

```text
src/
├── assets/          # Ativos estáticos (imagens, ícones)
├── components/      # Componentes UI reutilizáveis (Shadcn UI)
│   └── ui/          # Componentes de base e o núcleo do Mapa
├── features/        # Módulos baseados em domínio
│   ├── authentication/ # Lógica e UI de login
│   └── map/            # Visualizações, hooks e serviços de mapa
├── hooks/           # Hooks globais (ex: useAuth)
├── lib/             # Utilitários compartilhados (ex: cn)
├── pages/           # Páginas principais da aplicação
├── styles/          # Variáveis globais de estilo e temas (CSS)
├── App.tsx          # Roteamento e Provedores
└── main.tsx         # Ponto de entrada
```

## 🚀 Como Rodar a Aplicação

### Pré-requisitos
- Node.js (v20+)
- npm ou yarn

### Instalação
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

### Configuração
Crie um arquivo `.env` na raiz do projeto com a seguinte variável:
```env
VITE_API_URL=http://seu-backend-mapi-api:8080
```

### Desenvolvimento
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Build
Para gerar a versão de produção:
```bash
npm run build
```

## 🐳 Execução via Docker (Ecossistema Completo)
Para executar todo o ecossistema MAPI (API, AI e Front) de forma orquestrada, utilizamos o Docker Compose centralizado no repositório da **MAPI API**.

As instruções detalhadas de como subir todos os serviços simultaneamente podem ser encontradas aqui:
[Guia de Orquestração MAPI (Docker Compose)](https://github.com/Lucas-Pavao/projeto-mapi-api)

## 📄 Licença
Este projeto está sob a licença **MIT**.
