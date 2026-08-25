# TalentFlow — gestão de candidatos

Aplicação React + TypeScript criada com Vite para gerenciar processos seletivos em Kanban ou lista.

## Executar

```bash
npm install
npm run dev
```

## Decisões de arquitetura

- `src/services`: contrato assíncrono de dados isolado da UI; hoje usa mock com atraso artificial e pode ser substituído por Axios/API sem alterar componentes.
- `src/store`: Zustand com persistência em `sessionStorage` para modo da tela, busca, filtros, candidatos já carregados e posição de cada coluna.
- `src/hooks`: regras de carregamento paginado, detalhes e filtros separadas da camada visual.
- `src/components`: componentes organizados por domínio; cards e colunas são memoizados.
- `src/data`: 350 candidatos determinísticos para testar as colunas, busca e filtros.

Cada coluna busca páginas de 18 registros e só monta os cards já carregados. Ao aproximar-se do fim da lista vertical, uma nova página é buscada com skeleton de carregamento. O Kanban possui scroll horizontal único e cabeçalhos de coluna fixos.
