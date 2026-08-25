# TalentFlow API

Backend do TalentFlow (ATS) — NestJS + MongoDB/Mongoose, com módulos de candidatos, vagas, candidaturas (pipeline), banco de talentos e IA (extração de currículo + match candidato x vaga).

## Stack

- NestJS + TypeScript, arquitetura modular
- MongoDB via Mongoose
- class-validator / class-transformer nos DTOs (ValidationPipe global)
- Swagger (`/api/docs`)
- IA: OpenAI (chave via `.env`) com fallback automático para um provider mock quando não há chave configurada

## Rodando localmente

### 1. Suba o MongoDB

```bash
docker compose up -d
```

Isso sobe um MongoDB em `mongodb://localhost:27017/talentflow` (ver `docker-compose.yml`). Se preferir usar o MongoDB Atlas ou uma instância própria, basta apontar `MONGODB_URI` no `.env`.

### 2. Configure o `.env`

```bash
cp .env.example .env
```

Sem `OPENAI_API_KEY`, o `AiService` usa automaticamente um provider mock (heurístico, sem custo/latência de rede) — o fluxo de upload de currículo e match funciona normalmente para desenvolvimento. Para usar a IA de verdade, preencha `OPENAI_API_KEY`.

### 3. Instale as dependências e suba a API

```bash
npm install
npm run start:dev
```

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

## Estrutura

```
src/
  main.ts                # bootstrap, CORS, ValidationPipe, Swagger, /uploads estático
  app.module.ts
  config/                 # variáveis de ambiente tipadas + validação (Joi)
  common/
    filters/              # tratamento global de erros
    guards/                # guard de autenticação (preparado, hoje pass-through)
    decorators/
    dto/                  # paginação compartilhada
  modules/
    candidate/             # CRUD + upload/extração de currículo (IA)
    vacancy/                # CRUD de vagas + pipeline de etapas
    application/            # candidato x vaga: etapa, status, aderência (IA)
    talent-bank/             # banco de talentos + match/sugestão de candidatos
    ai/                       # AiService + providers (OpenAI real / mock)
uploads/                  # arquivos de currículo enviados (git-ignorado)
```

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/candidates` | Criar candidato |
| GET | `/candidates` | Listar/buscar candidatos |
| GET | `/candidates/:id` | Detalhe |
| PATCH | `/candidates/:id` | Editar |
| DELETE | `/candidates/:id` | Remover |
| POST | `/candidates/resume/parse` | Upload de currículo (PDF/DOCX) → extração via IA (preview, não persiste) |
| POST | `/vacancies` | Criar vaga |
| GET | `/vacancies` | Listar vagas |
| PATCH \| DELETE | `/vacancies/:id` | Editar/remover |
| POST | `/applications` | Vincular candidato a vaga |
| PATCH | `/applications/:id/stage` | Mover etapa |
| PATCH | `/applications/:id/status` | Alterar status |
| POST | `/applications/:id/evaluate` | Calcular aderência via IA |
| GET | `/talent-bank` | Candidatos sem vaga |
| GET | `/talent-bank/match/:vacancyId` | Sugestão rápida (skills) |
| POST | `/talent-bank/match/:vacancyId/ai` | Sugestão reforçada por IA |
| POST | `/talent-bank/assign` | Adicionar candidatos do banco a uma vaga |

Todas as rotas têm prefixo `/api/v1`. Documentação completa e testável em `/api/docs`.

## Notas de produção

- **CORS**: configurado via `CORS_ORIGIN` (lista separada por vírgula).
- **Upload**: limite de tamanho via `UPLOAD_MAX_SIZE_MB`, tipos aceitos restritos a PDF/DOCX (validado tanto no Multer quanto no controller).
- **Erros**: filtro global (`AllExceptionsFilter`) normaliza qualquer exceção num payload JSON consistente.
- **Autenticação**: `JwtAuthGuard` já está estruturado (`src/common/guards`) mas não é aplicado globalmente ainda — é o próximo passo natural quando o produto precisar de login (basta registrá-lo como `APP_GUARD` em `AppModule` e implementar a validação real do token).
