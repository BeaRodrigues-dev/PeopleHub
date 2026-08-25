# People Hub — HR OS

Plataforma de People & HR completa: recrutamento (ATS), banco de talentos, gestão de colaboradores, onboarding, analytics, pipeline de consultoria de RH, insights e relatório semanal — com IA aplicada onde faz sentido (match candidato x vaga, previsão de time-to-fill, geração automática de insights). Frontend em React + backend em NestJS/MongoDB.

```
frontend/       React + TypeScript + MUI + dnd-kit + React Query
backend/        NestJS + MongoDB (Mongoose) + OpenAI (com fallback mock)
mock-backend/   Alternativa zero-dependência ao backend/ (Node puro, sem Mongo/Docker/npm install)
```

## Rodando localmente

Existem **dois backends intercambiáveis** — o frontend fala com qualquer um dos dois sem alteração de código, só trocando `VITE_API_URL`. Use o que fizer mais sentido pra você:

| | `backend/` (real) | `mock-backend/` |
|---|---|---|
| Dependências | `npm install` + Docker/MongoDB | nenhuma (só Node.js) |
| Dados | persistidos no MongoDB | em memória, resetam a cada restart |
| IA | OpenAI real (com `OPENAI_API_KEY`) ou mock | sempre mock |
| Uso recomendado | rodar o produto "de verdade" | subir uma demo em segundos, sem instalar nada |

### Opção A — backend real (NestJS + MongoDB)

```bash
cd backend
docker compose up -d        # sobe o MongoDB local
cp .env.example .env        # sem OPENAI_API_KEY, usa IA mock automaticamente
npm install
npm run start:dev
```

API em `http://localhost:3001/api/v1`, Swagger em `http://localhost:3001/api/docs`. Detalhes completos em [`backend/README.md`](./backend/README.md).

### Opção B — mock-backend (zero dependências)

```bash
cd mock-backend
node server.js
```

Sobe na mesma porta (`3001`), sem precisar de `npm install`, Docker ou Mongo. Detalhes em [`mock-backend/README.md`](./mock-backend/README.md).

### Frontend (funciona com qualquer um dos dois backends acima)

```bash
cd frontend
npm install
npm run dev
```

O `.env` do frontend já vem configurado para `http://localhost:3001/api/v1` (padrão dos dois backends). App em `http://localhost:5173`. O frontend depende 100% da API (sem dados mockados no próprio frontend) — sem nenhum backend rodando, as telas mostram estados de erro/loading, como um produto real.

## Módulos

- **Home**: resumo diário (KPIs, tarefas da semana, insights recentes).
- **Recruitment**: vagas com pipeline Kanban configurável, drag and drop (dnd-kit), match candidato x vaga por IA, previsão de time-to-fill por IA.
- **Talent Pool**: banco de candidatos sem vaga associada, com ranking de aderência por vaga.
- **People**: base de colaboradores (tabela + visão por fase do lifecycle).
- **Onboarding**: checklist por fases (antes do 1º dia / 1º dia / 1ª semana), com progresso automático e sugestão de checklist por IA a partir do cargo.
- **Analytics**: KPIs de recrutamento, funil de candidaturas, distribuição de headcount por área/lifecycle, impacto de negócio.
- **Consulting**: pipeline de empresas (serviços de consultoria de RH), catálogo de serviços, funil de business dev, qualificação de leads por IA.
- **Insights**: observações/problemas/oportunidades — manuais ou geradas automaticamente por IA a partir dos dados reais do sistema (vagas paradas, onboardings atrasados, oportunidades de negócio, etc.).
- **Weekly Report**: relatório semanal editável com preview e cópia para compartilhamento.
- **Documentos**: manuais e políticas da área de People (upload de PDF/DOCX, categorização).

## Onde a IA entra

- **Match candidato x vaga**: comparação de competências, ranking rápido (heurístico) por padrão e reforço opcional via IA real (OpenAI) para os melhores colocados.
- **Time-to-fill**: previsão de dias até o preenchimento de uma vaga aberta, baseada em senioridade, nº de competências exigidas, modelo de trabalho e velocidade real do pipeline.
- **Insights automáticos**: leitura do estado do sistema (vagas, candidaturas, onboardings, pipeline de consulting, colaboradores) para sugerir problemas, oportunidades e sugestões acionáveis.
- **Checklist de onboarding**: sugestão de itens de checklist personalizados a partir do cargo do novo colaborador.
- **Qualificação de leads**: prioridade e próximo passo sugerido para cada empresa no pipeline de consulting.

## Notas de arquitetura

- Backend modular (candidate, vacancy, application, talent-bank, employee, onboarding, consulting, insight, document, ai), DTOs com `class-validator`, guard de autenticação já estruturado (não aplicado ainda — próximo passo natural ao adicionar login).
- `AiService` é uma fachada sobre um `AiProvider` — troca entre OpenAI real e o provider mock só depende de `OPENAI_API_KEY` estar setada, sem tocar no resto do código.
- Frontend organizado por `features/` (candidate, vacancy, kanban, talent-bank, people, onboarding, consulting, insights, weekly-report, docs, ai), cada uma com sua camada de API (`api.ts`) e hooks de React Query (`queries.ts`) — sem estado global duplicando o cache do servidor.
- Drawers/modais via Portal (`createPortal`), sempre acima do header, com scroll interno próprio e responsivos.
- UX: toasts de feedback, skeleton loading, estados vazios e de erro tratados em toda a aplicação.
