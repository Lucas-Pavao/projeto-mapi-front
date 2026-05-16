# Gemini CLI Context: Projeto Mapi Front

This project is a React-based frontend application for a map-centric system, likely focused on sensor monitoring or geospatial data visualization. It uses modern tooling and a feature-based architecture.

## Project Overview

- **Core Technologies:** React 19, Vite, TypeScript, Tailwind CSS.
- **Mapping Stack:** MapLibre GL via a custom `Map` component (located in `src/components/ui/map.tsx`). It uses CartoDB basemaps by default.
- **UI Framework:** Shadcn UI (Radix UI primitives) and Lucide React icons.
- **State Management:** React Context API for global state (e.g., Authentication).
- **Architecture:** Feature-Based Architecture, organizing code by domain (e.g., `src/features/map`, `src/features/authentication`).

## Architecture & Structure

- `src/features/`: Contains domain-specific logic, components, hooks, and services.
  - `authentication/`: Login logic, auth services, and types.
  - `map/`: Map views and specific UI like `SensorSidebar`.
- `src/components/ui/`: Generic, reusable UI components (Buttons, Inputs, Cards, and the core Map component).
- `src/hooks/`: Global shared hooks like `useAuth`.
- `src/pages/`: Main application routes (e.g., `LoginPage`, `MapPage`).
- `src/lib/`: Shared utilities (e.g., Tailwind merge utility `cn`).
- `src/assets/`: Static assets like images and SVGs.

## Development Workflow

### Key Commands

- **Development:** `npm run dev` (starts Vite dev server).
- **Build:** `npm run build` (compiles and builds for production).
- **Lint:** `npm run lint` (runs ESLint).
- **Preview:** `npm run preview` (previews production build locally).

### Environment Configuration

The application requires a `.env` file in the root with the following variables:

- `VITE_API_URL`: The base URL for the backend API (e.g., `http://localhost:3000`).

## Technical Conventions

### Code Style & Patterns

- **Component Structure:** Prefer functional components with TypeScript interfaces for props.
- **Alias:** Use `@/` to refer to the `src/` directory (configured in `vite.config.ts` and `tsconfig.json`).
- **Auth Pattern:** Authentication state is managed via `AuthContext` in `src/hooks/useAuth.tsx`. Tokens and user data are persisted in `localStorage`.
- **API Communication:** Use `axios`. Services should be organized within their respective feature folders (e.g., `src/features/authentication/services/auth.service.ts`).
- **Styling:** Use Tailwind CSS utility classes. For complex conditional classes, use the `cn` utility from `src/lib/utils.ts`.

### Map Component Usage

The custom `Map` component in `src/components/ui/map.tsx` is highly flexible and supports:
- **Themes:** Light/Dark mode detection.
- **Markers & Popups:** Using `MapMarker`, `MarkerPopup`, and `MapPopup` sub-components via a Context/Portal pattern.
- **Layers:** Support for `MapRoute`, `MapArc`, and `MapClusterLayer`.
- **Controls:** `MapControls` for zoom, locate, and fullscreen.

## Important Files

- `package.json`: Dependency and script definitions.
- `src/App.tsx`: Main routing and provider setup.
- `src/components/ui/map.tsx`: Core mapping logic.
- `src/hooks/useAuth.tsx`: Authentication hook and provider.
- `vite.config.ts`: Vite configuration and aliases.
