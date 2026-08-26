import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base "/PeopleHub/" é necessário para o build funcionar corretamente quando
// publicado em GitHub Pages num "project site" (bearodrigues-dev.github.io/PeopleHub/).
// Se o nome do repositório mudar, ajuste aqui também.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/PeopleHub/' : '/',
  plugins: [react()],
});
