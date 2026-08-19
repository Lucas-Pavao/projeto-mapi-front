import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Padrão comum em arquivos shadcn (ex: button.tsx exporta `buttonVariants` cva junto
      // com o componente) e em hooks de contexto (ex: useAuth.tsx exporta o hook `useAuth`
      // junto com o `AuthProvider`). `allowConstantExport` é a opção oficial da regra pra
      // não marcar esses exports não-componente como erro de Fast Refresh.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
