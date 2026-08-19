import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // process.env não é populado a partir do .env dentro do próprio arquivo de config — só pro
  // código do app via import.meta.env. loadEnv lê o .env manualmente pra esse valor também
  // valer aqui, no target do proxy do dev server.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Mesmo motivo do proxy do nginx.conf em produção: cookie httpOnly de sessão precisa que
      // front e API sejam "same-origin" pro navegador, senão exigiria SameSite=None+Secure (e
      // portanto HTTPS) mesmo rodando localmente com `npm run dev`.
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
