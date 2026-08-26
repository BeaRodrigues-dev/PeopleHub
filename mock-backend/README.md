# mock-backend

Backend **zero-dependência** (só Node.js core: `http`, `crypto`, `fs`, `path`) que
implementa o mesmo contrato de API do backend NestJS real em `backend/`.

## Por que existe

O `backend/` real precisa de `npm install` (NestJS, Mongoose, etc.) e de um
MongoDB rodando (via `docker-compose up`). Se você quiser subir o produto
localmente sem instalar nada ou sem Docker/Mongo disponível, use este servidor
no lugar — o frontend fala com os dois sem nenhuma alteração de código, só
trocando `VITE_API_URL`.

Diferenças em relação ao backend real:

- Dados ficam **100% em memória** (array JS), recriados/semeados a cada `node server.js`. Nada é persistido em disco (exceto os arquivos de upload em `uploads/`).
- Não há MongoDB, Mongoose, nem `docker-compose`.
- IA é sempre a heurística mock (equivalente ao `MockAiProvider` do backend real) — nunca chama OpenAI, mesmo se `OPENAI_API_KEY` estiver definida.
- Extração de currículo (`POST /candidates/resume/parse`) não lê o PDF/DOCX de verdade (não há `pdf-parse`/`mammoth` disponíveis); gera um texto de currículo plausível a partir do nome do arquivo, suficiente para exercitar o fluxo completo (upload → IA → confirmação → criação do candidato).

Fora isso, os endpoints, formatos de request/response, status codes (incluindo
`409` em candidatura duplicada, `404`, `413`, etc.) e regras de negócio
(pipeline de etapas, `matchScore`, vínculo candidato↔vaga) são os mesmos.

## Rodar

```bash
cd mock-backend
node server.js
# ou: npm start
```

Sobe em `http://localhost:3001` (mesma porta padrão do backend real). Ao
iniciar, semeia automaticamente ~10 vagas, ~100+ candidatos e várias
candidaturas de exemplo — tudo perdido ao reiniciar o processo, de propósito.

Porta customizada: `PORT=4000 node server.js`.

## Endpoints

Prefixo: `/api/v1`. Todas as rotas abaixo (exceto `POST /auth/login` e `GET /health`)
exigem header `Authorization: Bearer <token>` — veja a seção "Autenticação".

- `POST /auth/login` (público), `GET /auth/me`
- `GET/POST /candidates`, `GET/PATCH/DELETE /candidates/:id`
- `GET /candidates/counts-by-vacancy`
- `POST /candidates/resume/parse` (multipart, campo `file`)
- `GET/POST /vacancies`, `GET/PATCH/DELETE /vacancies/:id`
- `GET/POST /applications`, `GET/DELETE /applications/:id`
- `PATCH /applications/:id/stage`, `PATCH /applications/:id/status`
- `POST /applications/:id/evaluate` (avaliação IA mock)
- `GET /talent-bank` (candidatos sem vaga)
- `GET /talent-bank/match/:vacancyId` (ranking heurístico)
- `POST /talent-bank/match/:vacancyId/ai` (reforço IA mock no top N)
- `POST /talent-bank/assign`
- `GET /vacancies/:id/time-to-fill` (previsão de dias até preencher a vaga, IA)
- `GET/POST/PATCH/DELETE /employees` (People)
- `GET/POST/DELETE /onboardings`, `PATCH /onboardings/:id/checklist`
- `POST /ai/onboarding-checklist` (checklist sugerido por IA a partir do cargo)
- `GET /consulting-leads`, `GET /consulting-leads/services`, `POST/PATCH/DELETE /consulting-leads`, `POST /consulting-leads/:id/qualify` (qualificação IA)
- `GET/POST/DELETE /insights`, `POST /ai/insights/generate` (insights automáticos a partir dos dados do sistema)
- `GET/POST/DELETE /documents` (manuais/documentos, multipart)
- `GET /health`
- Arquivos enviados servidos em `/uploads/:arquivo`

Todos os endpoints foram validados via `curl` (CRUD completo, conflito 409 em
candidatura duplicada, transição de etapa, avaliação IA, matching, upload
multipart e casos 404).

## Autenticação

Conta única (email + senha), sem cadastro de múltiplos usuários. `POST
/auth/login` retorna um token assinado (HMAC-SHA256, válido por 12h) que o
frontend guarda e reenvia em todas as chamadas. Sem token válido, qualquer
rota `/api/v1/*` (exceto login e `/health`) responde `401`.

Credenciais padrão (só para desenvolvimento local — **não usar em produção**,
o hash abaixo está commitado neste repositório público):

- Email: `beatriz@peoplehub.local`
- Senha: definida via `AUTH_PASSWORD` (ver abaixo); sem ela, cai numa senha de
  desenvolvimento fixa que não deve ser considerada segura.

Antes de publicar este servidor (Render ou qualquer host), defina no
ambiente:

```bash
AUTH_EMAIL=beatriz@peoplehub.local
AUTH_PASSWORD=<uma senha forte>
AUTH_SECRET=<uma string aleatória longa>
```

Sem essas variáveis, o servidor sobe mesmo assim (para não travar o dev
local), mas imprime um aviso no log e usa a senha padrão insegura.

## Ligar o frontend a este servidor

Já configurado por padrão — `frontend/.env` aponta para
`http://localhost:3001/api/v1`, a mesma porta usada aqui. Basta rodar este
servidor e depois o frontend (`cd frontend && npm run dev`) normalmente.

Para usar o backend NestJS real em vez deste mock, veja `backend/README.md`.
