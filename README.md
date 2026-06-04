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

## 📂 Estrutura de Pastas

O projeto adota uma **Arquitetura Baseada em Funcionalidades (Feature-Based Architecture)**, facilitando a escalabilidade e manutenção:

```text
src/
├── assets/             # Recursos estáticos (imagens, ícones globais)
├── components/         # Componentes UI básicos e reutilizáveis
│   └── ui/             # Componentes Shadcn (Button, Input, Map, etc.)
├── features/           # Módulos isolados por domínio de negócio
│   ├── authentication/ # Login, AuthProvider, serviços de auth
│   └── map/            # MapView, Sidebar de sensores, lógica de camadas, clima e marés
├── hooks/              # Custom hooks globais (ex: useAuth)
├── lib/                # Configurações de libs externas e utilitários (cn, utils)
├── pages/              # Componentes de página (rotas principais)
├── App.tsx             # Orquestrador de rotas e providers
└── main.tsx            # Ponto de entrada da aplicação
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
- **[MAPI API](https://github.com/Lucas-Pavao/projeto-mapi-api):** Backend em Node.js/Express (ou FastAPI) responsável pelo processamento de dados e regras de negócio.
- **[MAPI AI](https://github.com/Lucas-Pavao/projeto-mapi-ai):** Componente de inteligência artificial para predição de níveis e análise de tendências.
- **[MAPI CLI](https://github.com/Lucas-Pavao/projeto-mapi):** Ferramentas de automação e ingestão de dados legados.

---
Desenvolvido com 💙 para o monitoramento inteligente.
