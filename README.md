# MAPI - Plataforma de Monitoramento Ambiental 🗺️✨

O **MAPI Frontend** é a interface principal do ecossistema MAPI, uma solução avançada de visualização geoespacial focada na Região Metropolitana do Recife. O sistema foi projetado para consolidar dados de sensores IoT, previsões meteorológicas e informações hidrológicas em um dashboard interativo e de alta performance.

## 📝 Descrição do Projeto

O projeto visa fornecer uma ferramenta de tomada de decisão para órgãos públicos e pesquisadores, permitindo o acompanhamento em tempo real de níveis de marés, precipitação e áreas de risco. Através de uma integração fluida com o [MAPI API](https://github.com/Lucas-Pavao/projeto-mapi-api) e modelos de IA do [MAPI AI](https://github.com/Lucas-Pavao/projeto-mapi-ai), o frontend entrega visualizações precisas e alertas inteligentes.

### Principais Diferenciais:
- **Visualização Geoespacial Dinâmica:** Uso de MapLibre GL para renderização eficiente de grandes conjuntos de dados.
- **Monitoramento IoT em Tempo Real:** Acompanhamento de sensores de nível, precipitação e status operacional.
- **Dados Oceanográficos e Meteorológicos:** Integração de previsões de marés, condições marinhas e clima (ondas, vento, temperatura).
- **Gestão de Eventos de Inundação:** Registro, visualização e análise de pontos críticos e histórico de alagamentos.
- **Ferramentas Administrativas e de Exportação:** Gestão de dispositivos, controle de acesso e exportação de relatórios técnicos.
- **Design Adaptativo:** Interface moderna com suporte a temas Dark e Light, otimizada para operação em centros de comando.

## 🛠️ Tecnologias Escolhidas

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework Core** | [React 19](https://react.dev/) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Bundler** | [Vite 8](https://vitejs.dev/) |
| **Mapas** | [MapLibre GL](https://maplibre.org/) & [React Map GL](https://visgl.github.io/react-map-gl/) |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) |
| **Roteamento** | [React Router 7](https://reactrouter.com/) |
| **Comunicação** | [Axios](https://axios-http.com/) |
| **Ícones** | [Lucide React](https://lucide.dev/) |

## 📂 Estrutura de Pastas Detalhada

A organização do projeto adota uma **Arquitetura Baseada em Funcionalidades (Feature-Based Architecture)**, otimizada para escalabilidade e separação de preocupações:

```text
projeto-mapi-front/
├── public/                 # Ativos estáticos públicos (ícones, favicons)
├── src/
│   ├── assets/             # Recursos estáticos processados pelo bundler (imagens, SVGs)
│   ├── components/         # Componentes React compartilhados e reutilizáveis
│   │   └── ui/             # Primitivos de UI (Shadcn/UI) e o componente de mapa base
│   ├── features/           # Módulos isolados por domínio de negócio (Core da lógica)
│   │   ├── authentication/ # Gestão de identidade, formulários de login e tokens
│   │   │   ├── components/ # Componentes específicos (LoginForm, etc.)
│   │   │   ├── hooks/      # Hooks de lógica de autenticação
│   │   │   ├── services/   # Integração com API de Auth
│   │   │   └── types/      # Definições de tipos TypeScript para Auth
│   │   └── map/            # Dashboard principal, camadas e interações geoespaciais
│   │       ├── components/ # UI do mapa (Sidebar, Modais, Cards de detalhes)
│   │       ├── hooks/      # Lógica de manipulação de dados e estados do mapa
│   │       ├── services/   # Serviços de dados (Sensores, Marés, Clima, Flood)
│   │       ├── types/      # Tipagem estruturada para entidades geoespaciais
│   │       └── utils/      # Utilitários de conversão e formatação de dados
│   ├── hooks/              # Hooks customizados globais (ex: useAuth context)
│   ├── lib/                # Configurações de bibliotecas externas e utilitários (cn)
│   ├── pages/              # Componentes de página que definem os pontos de entrada das rotas
│   ├── App.tsx             # Root component com orquestração de rotas e provedores
│   ├── main.tsx            # Ponto de entrada da aplicação e montagem do DOM
│   └── index.css           # Estilos globais e diretivas do Tailwind CSS
├── .env.example            # Template de variáveis de ambiente
├── components.json         # Configuração do Shadcn/UI
├── eslint.config.js        # Regras de linting para qualidade de código
├── GEMINI.md               # Dicionário de convenções e diretrizes do projeto
├── index.html              # Template HTML principal
├── package.json            # Manifest do projeto e dependências
├── tsconfig.json           # Configuração mestre do TypeScript
└── vite.config.ts          # Configuração do build e aliases de caminho (@/*)
```

## 🚀 Como Rodar a Aplicação

### Pré-requisitos
- **Node.js:** Versão 20 ou superior.
- **Gerenciador de Pacotes:** NPM (incluído no Node).

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/Lucas-Pavao/projeto-mapi-front.git
   cd projeto-mapi-front
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto (ou copie do `.env.example`):
   ```bash
   VITE_API_URL=http://localhost:3000
   ```
   *Certifique-se de que o [MAPI API](https://github.com/Lucas-Pavao/projeto-mapi-api) esteja rodando para o funcionamento completo.*

4. **Executar em Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5173`

5. **Gerar Build de Produção:**
   ```bash
   npm run build
   ```

## 🌐 Ecossistema MAPI

O MAPI é composto por diferentes módulos que trabalham de forma integrada:
- **[MAPI API](https://github.com/Lucas-Pavao/projeto-mapi-api):** Backend em Spring Boot responsável pelo processamento de dados e regras de negócio.
- **[MAPI AI](https://github.com/Lucas-Pavao/projeto-mapi-ai):** Componente de inteligência artificial para predição de níveis e análise de tendências.
- **[MAPI CLI](https://github.com/Lucas-Pavao/projeto-mapi):** Ferramentas de automação e ingestão de dados legados.

---
Desenvolvido com 💙 para o monitoramento inteligente.
