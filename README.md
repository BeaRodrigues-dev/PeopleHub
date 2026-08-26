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

## Deploy (link público)

O jeito mais rápido de ter um link real (tipo `seusite.onrender.com`) é usando o
[Render](https://render.com) com o blueprint já incluso (`render.yaml`) — sobe o
`mock-backend` (zero dependências) + o frontend estático, sem precisar de MongoDB.

1. Suba o código pro GitHub (`git push origin main` — ver instruções acima).
2. Crie uma conta em [render.com](https://render.com) (dá pra entrar direto com a conta do GitHub).
3. No dashboard: **New** → **Blueprint** → selecione o repositório `poc-kanban`.
4. O Render lê o `render.yaml` da raiz e propõe 2 serviços: `peoplehub-mock-backend` (API) e `peoplehub-frontend` (site). Clique em **Apply**.
5. Espere os dois builds terminarem (alguns minutos). O link do site fica em algo como `https://peoplehub-frontend.onrender.com`.

Detalhes:
- Plano gratuito do Render "dorme" o backend após 15 min sem uso — a primeira requisição depois disso demora ~30s pra acordar, normal em plano free.
- Dados do `mock-backend` ficam em memória: são resetados sempre que o Render reinicia o serviço (por inatividade ou deploy novo) — perfeito pra demo, não pra produção real.
- Se o nome `peoplehub-mock-backend` já estiver em uso por outra pessoa no Render, o serviço sobe com outro nome — nesse caso, ajuste a variável `VITE_API_URL` do serviço `peoplehub-frontend` (Render → serviço → Environment) para apontar pra URL real do backend, e clique em **Manual Deploy** no frontend pra rebuildar.
- Pra usar o backend real (NestJS + MongoDB) em produção em vez do mock, é preciso um MongoDB gerenciado (ex.: MongoDB Atlas free tier) e ajustar `MONGODB_URI`/`OPENAI_API_KEY` nas env vars do serviço — ver `backend/README.md`.

### GitHub Pages (link `bearodrigues-dev.github.io/poc-kanban`)

Se você quer o link aparecendo direto na seção "About" do repositório no GitHub
(estilo `usuario.github.io/repo`), use o workflow já incluso
(`.github/workflows/deploy-pages.yml`). Ele builda só o **frontend** — GitHub
Pages não roda backend, então o site publicado ainda precisa de uma API
hospedada em algum lugar (o backend do Render, passo acima, é o mais simples).

1. Suba o backend no Render primeiro (seção anterior) e copie o link dele (ex.: `https://peoplehub-mock-backend.onrender.com`).
2. No GitHub: **Settings** → **Pages** → em "Build and deployment", troque **Source** para **GitHub Actions**.
3. (Opcional, só se o link do seu backend for diferente do padrão) **Settings** → **Secrets and variables** → **Actions** → aba **Variables** → **New repository variable**: nome `VITE_API_URL`, valor `https://SEU-BACKEND.onrender.com/api/v1`.
4. Faça um `git push` (ou rode o workflow manualmente em **Actions** → "Deploy frontend to GitHub Pages" → **Run workflow**).
5. Depois que o workflow terminar (ícone verde em **Actions**), o link aparece automaticamente em **Settings** → **Pages**, e também no ícone de engrenagem do "About" na página principal do repo (marque "Use your GitHub Pages website").

O link final fica algo como `https://bearodrigues-dev.github.io/poc-kanban/`.

## Autenticação

O app tem login (conta única, email + senha) protegendo todas as rotas da
API — necessário porque, uma vez publicado, o site fica acessível por
qualquer pessoa com o link, e os dados (candidatos, colaboradores,
documentos internos) não podem vazar.

- Token assinado (HMAC-SHA256, 12h de validade), mesmo esquema implementado tanto no `backend/` quanto no `mock-backend/`.
- Sem cadastro de múltiplos usuários — é uma conta compartilhada da área de People.
- Localmente, sem nenhuma variável de ambiente definida, os dois backends usam uma senha padrão de desenvolvimento (impressa como aviso no console ao iniciar o servidor).

**Antes de deixar o site público (Render ou qualquer host), defina estas variáveis de ambiente no serviço do backend:**

```
AUTH_EMAIL=<email de login>
AUTH_PASSWORD=<senha forte>
AUTH_SECRET=<string aleatória longa>
```

Sem isso, a senha padrão (cujo hash está commitado neste repositório
público) continua valendo — ela é só para desenvolvimento local e não deve
ser considerada segura para produção. No `render.yaml`, essas 3 variáveis já
estão declaradas como `sync: false` (o Render pede pra você preenchê-las
manualmente no dashboard, sem ficarem no código).

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

- Backend modular (candidate, vacancy, application, talent-bank, employee, onboarding, consulting, insight, document, ai, auth), DTOs com `class-validator`, guard de autenticação global (`JwtAuthGuard`) protegendo toda a API por padrão.
- `AiService` é uma fachada sobre um `AiProvider` — troca entre OpenAI real e o provider mock só depende de `OPENAI_API_KEY` estar setada, sem tocar no resto do código.
- Frontend organizado por `features/` (candidate, vacancy, kanban, talent-bank, people, onboarding, consulting, insights, weekly-report, docs, ai), cada uma com sua camada de API (`api.ts`) e hooks de React Query (`queries.ts`) — sem estado global duplicando o cache do servidor.
- Drawers/modais via Portal (`createPortal`), sempre acima do header, com scroll interno próprio e responsivos.
- UX: toasts de feedback, skeleton loading, estados vazios e de erro tratados em toda a aplicação.
