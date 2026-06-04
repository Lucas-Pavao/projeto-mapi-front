# Projeto MAPI - Frontend 🗺️✨

O **MAPI Frontend** é uma plataforma avançada de visualização geoespacial desenvolvida para o monitoramento em tempo real de dados ambientais e hidrológicos. Focado na Região Metropolitana do Recife, o sistema integra dados de diversos sensores IoT e APIs meteorológicas em uma interface intuitiva e moderna.

## 🛠️ Tecnologias Escolhidas

- **Framework:** React 19 (Functional Components & Hooks)
- **Linguagem:** TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS com Shadcn UI
- **Mapas:** MapLibre GL e React Map GL
- **Comunicação:** Axios
- **Roteamento:** React Router

## ✨ Funcionalidades / Features

- 📍 **Mapa Interativo:** Visualização em tempo real de estações e sensores com suporte a temas Dark/Light.
- 📊 **Monitoramento Live:** Acompanhamento de níveis de chuva, umidade e status de bateria dos sensores IoT.
- 🌊 **Gestão de Marés:** Visualização de tábuas de marés e integração com dados do Porto de Recife.
- 🔍 **Análise de Pontos Críticos:** Monitoramento específico de áreas com histórico de inundação.
- 🔐 **Área Restrita:** Autenticação JWT para acesso a ferramentas de administração e ingestão de dados.

## 📂 Estrutura de Pastas

O projeto utiliza uma **Arquitetura Baseada em Funcionalidades (Feature-Based Architecture)**:

```text
projeto-mapi-front/
├── src/
│   ├── assets/             # Recursos estáticos (imagens, ícones)
│   ├── components/         # Componentes UI reutilizáveis (Shadcn)
│   ├── features/           # Módulos de domínio (auth, map, sensors)
│   ├── hooks/              # Hooks globais (useAuth, useMap)
│   ├── lib/                # Configurações de bibliotecas (axios, tailwind merge)
│   ├── pages/              # Componentes de página (Login, Map)
│   ├── services/           # Clientes de API e serviços globais
│   ├── types/              # Definições de tipos TypeScript
│   └── utils/              # Funções utilitárias
├── public/                 # Arquivos públicos estáticos
├── package.json            # Gestão de dependências e scripts
└── vite.config.ts          # Configuração do Vite
```

## 📋 Pré-requisitos

- Node.js v20 ou superior.
- NPM ou PNPM instalado.

## 🚀 Como instalar e rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Lucas-Pavao/projeto-mapi-front.git
   cd projeto-mapi-front
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Ajuste a variável VITE_API_URL para apontar para o seu backend
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:5173`.

## 🤝 Como contribuir

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua modificação (`git checkout -b feature/nova-view`).
3. Faça o **Commit** de suas alterações (`git commit -m 'Add: nova visualização de sensores'`).
4. Faça o **Push** para a sua Branch (`git push origin feature/nova-view`).
5. Abra um **Pull Request**.

## 📄 Licença

Este projeto está sob a licença **MIT**.
