# Projeto Mapi Front

Este é o frontend de uma aplicação moderna de monitoramento e visualização de dados geoespaciais, construído com React 19, TypeScript e Vite. O projeto utiliza uma arquitetura baseada em funcionalidades (Feature-Based Architecture) para garantir escalabilidade e manutenibilidade.

## 🚀 Tecnologias

- **React 19**: Biblioteca principal para construção da interface.
- **TypeScript**: Tipagem estática para maior segurança no desenvolvimento.
- **Vite**: Build tool extremamente rápida.
- **Tailwind CSS**: Framework CSS utilitário para estilização.
- **MapLibre GL**: Motor de mapas de alta performance.
- **Shadcn UI**: Componentes de UI acessíveis e personalizáveis (Radix UI).
- **Lucide React**: Conjunto de ícones consistentes.
- **Axios**: Cliente HTTP para comunicação com a API.

## 🏗️ Arquitetura e Estrutura

O projeto segue uma **Feature-Based Architecture**, onde o código é organizado por domínio de negócio:

```text
src/
├── assets/             # Ativos estáticos (imagens, ícones)
├── components/
│   └── ui/             # Componentes de UI genéricos (Button, Card, Map, etc.)
├── features/           # Funcionalidades principais do sistema
│   ├── authentication/ # Login, serviços de auth, tipos e componentes relacionados
│   └── map/            # Visualização do mapa, sidebar de sensores, etc.
├── hooks/              # Hooks globais compartilhados (ex: useAuth)
├── lib/                # Utilitários e configurações (ex: utils.ts para tailwind-merge)
├── pages/              # Componentes de página (rotas principais)
└── App.tsx             # Configuração de rotas e provedores contextuais
```

### Componentes de Destaque

- **`Map` (`src/components/ui/map.tsx`)**: Um componente wrapper robusto sobre o MapLibre GL, suportando marcadores, popups, camadas de cluster e rotas.
- **`AuthContext`**: Gerencia o estado de autenticação global e persistência de tokens.

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone git@github.com:Lucas-Pavao/projeto-mapi-front.git
   cd projeto-mapi-front
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Execução

- **Desenvolvimento**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Preview**: `npm run preview`

## 🗺️ Mapa e Provedores

Por padrão, o sistema utiliza os basemaps do **CartoDB** (Positron/Dark Matter), que não exigem chave de API para uso de desenvolvimento. A configuração do tema do mapa (Light/Dark) é detectada automaticamente ou pode ser configurada via props.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
