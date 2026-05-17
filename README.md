# Projeto MAPI - Frontend 🗺️📊

O **MAPI Frontend** é a interface web do Projeto MAPI (Monitoramento de Águas e Pluviometria Inteligente). Construído com tecnologias de ponta, o dashboard oferece uma visualização intuitiva e em tempo real dos dados geoespaciais e ambientais da Região Metropolitana do Recife.

## 📋 O que é o projeto?

O frontend atua como a camada de visualização do sistema, permitindo que gestores públicos e a população monitorem o nível dos rios, a precipitação pluviométrica e a tábua de marés. O foco principal é a detecção visual de áreas de risco e o acompanhamento de sensores IoT distribuídos geograficamente.

## 🏗️ Arquitetura

O projeto adota uma **Feature-Based Architecture** (Arquitetura Baseada em Funcionalidades), que organiza o código em torno de domínios de negócio em vez de tipos técnicos:

1.  **Funcionalidades (Features):** Cada módulo (ex: `authentication`, `map`) contém seus próprios componentes, hooks, serviços e tipos. Isso facilita o isolamento e a escalabilidade do projeto.
2.  **Componentes UI:** Utiliza uma biblioteca de componentes baseada no **Shadcn UI**, garantindo consistência visual e acessibilidade.
3.  **Gerenciamento de Estado:** Utiliza a Context API do React para estados globais como autenticação e preferências de mapa.
4.  **Motor de Mapa:** Baseado no **MapLibre GL**, permitindo renderização de alta performance de camadas vetoriais e marcadores dinâmicos.

## 📂 Estrutura do Projeto

```text
src/
├── assets/             # Imagens, ícones e arquivos estáticos
├── components/
│   └── ui/             # Componentes de interface reutilizáveis (botões, cards, etc.)
├── features/           # Módulos principais por domínio
│   ├── authentication/ # Login, registro e serviços de auth
│   └── map/            # Visualização do mapa, sidebar de sensores e filtros
├── hooks/              # Hooks customizados globais (ex: useAuth)
├── lib/                # Configurações e utilitários (axios, tailwind merge)
├── pages/              # Componentes de página (rotas principais)
└── services/           # Clientes de API e comunicação externa
```

## ⚙️ Como o projeto funciona?

1.  **Renderização Geoespacial:** Ao carregar o mapa, o frontend consome as coordenadas dos sensores da API e os renderiza como marcadores dinâmicos sobre o MapLibre GL.
2.  **Monitoramento em Tempo Real:** O dashboard exibe informações atualizadas vindas da API Spring Boot, incluindo gráficos de maré e alertas meteorológicos.
3.  **Fluxo de Autenticação:** O sistema gerencia o ciclo de vida dos tokens JWT, armazenando o Access Token em memória/estado e o Refresh Token via cookies seguros ou armazenamento local, garantindo uma navegação sem interrupções.
4.  **Responsividade:** A interface é construída com Tailwind CSS, sendo totalmente adaptável para dispositivos móveis e desktops.

## 🚀 Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** (Estilização)
- **MapLibre GL** (Mapas)
- **Shadcn UI + Lucide React** (Componentes e Ícones)
- **Axios** (Comunicação HTTP)
- **Zustand / Context API** (Estado)

---
**Interface desenvolvida para clareza e rapidez na tomada de decisão.**
