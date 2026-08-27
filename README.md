# People Hub — HR OS

Plataforma de People & HR completa: recrutamento (ATS), banco de talentos, gestão de colaboradores, onboarding, analytics, pipeline de consultoria de RH, insights e relatório semanal — com IA aplicada onde faz sentido (match candidato x vaga, previsão de time-to-fill, geração automática de insights).

```
frontend/       React + TypeScript + MUI + dnd-kit + React Query + Supabase
supabase/       schema.sql — tabelas, RLS e storage do banco de dados
backend/        (legado/opcional) NestJS + MongoDB — não é mais necessário
mock-backend/   (legado/opcional) servidor Node zero-dependência — não é mais necessário
```

O app fala **direto com o Supabase** (Postgres + Auth + Storage) a partir do navegador — não existe mais um servidor próprio para hospedar. `backend/` e `mock-backend/` ficam no repositório apenas como referência/histórico, mas não são usados pelo frontend atual.

## Configurar o Supabase (uma vez só)

1. Crie uma conta grátis em [supabase.com](https://supabase.com) e clique em **New project** (não pede cartão de crédito no plano free).
2. Espere o projeto terminar de provisionar (1–2 min).
3. Vá em **SQL Editor** (menu lateral) → **New query**, cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste repositório e clique em **Run**. Isso cria todas as tabelas, as regras de segurança (RLS) e os buckets de arquivo (`resumes`, `documents`).
4. Vá em **Authentication** → **Users** → **Add user** → **Create new user**. Preencha o email e a senha que você vai usar para logar no People Hub (marque "Auto Confirm User"). Essa é a única conta do sistema.
5. Vá em **Project Settings** (ícone de engrenagem) → **API**. Copie:
   - **Project URL**
   - **anon public key** (a chave pública, não a `service_role`)

## Rodando localmente

```bash
cd frontend
cp .env.example .env   # se ainda não existir
```

Edite `frontend/.env` e cole os valores copiados do Supabase:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

```bash
npm install
npm run dev
```

App em `http://localhost:5173`. Faça login com o email/senha criados no passo 4 acima.

## Deploy (link público)

Como o app não depende mais de nenhum servidor próprio, publicar é só subir o **frontend estático** em qualquer host — sem cartão de crédito, sem backend para manter no ar.

### GitHub Pages (recomendado — já vem configurado)

1. No GitHub do repositório: **Settings** → **Secrets and variables** → **Actions** → aba **Secrets** → **New repository secret**, crie dois:
   - `VITE_SUPABASE_URL` → a Project URL do seu Supabase
   - `VITE_SUPABASE_ANON_KEY` → a anon public key
2. **Settings** → **Pages** → em "Build and deployment", troque **Source** para **GitHub Actions** (se ainda não estiver).
3. Faça um `git push` (ou rode manualmente em **Actions** → "Deploy frontend to GitHub Pages" → **Run workflow**).
4. Quando o workflow terminar (ícone verde em **Actions**), o link aparece em **Settings** → **Pages** — algo como `https://SEU-USUARIO.github.io/PeopleHub/`.

Como a autenticação agora é 100% do Supabase (não depende de nenhum servidor seu no ar), o login funciona normalmente nesse link público, sem precisar hospedar nada além do site estático.

### Outras opções

Qualquer host de site estático funciona (Vercel, Netlify, Cloudflare Pages, etc.) — é só rodar `npm run build` dentro de `frontend/` com as duas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) configuradas, e publicar a pasta `frontend/dist`.

## Autenticação

Login (conta única, email + senha) via **Supabase Auth**, com sessão persistida no navegador e refresh automático de token. Não há cadastro de múltiplos usuários — é a conta compartilhada da área de People, criada no passo 4 da configuração do Supabase.

Trocar email/senha fica disponível dentro do próprio app em **Configurações** (engrenagem no menu lateral). Se você trocar o email, o Supabase pode pedir confirmação por um link enviado à nova caixa de entrada, dependendo da configuração do projeto (**Authentication** → **Providers** → **Email** → "Confirm email").

## Segurança dos dados (RLS)

Todas as tabelas usam Row Level Security: só um usuário autenticado (ou seja, logado com o email/senha criados no Supabase) consegue ler ou escrever dados. Sem estar logado, a API do Supabase recusa qualquer chamada — os dados não ficam expostos publicamente.

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
- **Documentos**: manuais e políticas da área de People (upload de PDF/DOCX, categorização, arquivos guardados no Supabase Storage).

## Onde a IA entra

Todas as heurísticas de IA rodam **direto no navegador** (`frontend/src/lib/ai.ts`), sem depender de nenhum serviço externo pago:

- **Match candidato x vaga**: comparação de competências exigidas x competências do candidato.
- **Time-to-fill**: previsão de dias até o preenchimento de uma vaga aberta, baseada em senioridade, nº de competências exigidas, modelo de trabalho e velocidade real do pipeline.
- **Insights automáticos**: leitura do estado do sistema (vagas, candidaturas, onboardings, pipeline de consulting, colaboradores) para sugerir problemas, oportunidades e sugestões acionáveis.
- **Checklist de onboarding**: sugestão de itens de checklist personalizados a partir do cargo do novo colaborador.
- **Qualificação de leads**: prioridade e próximo passo sugerido para cada empresa no pipeline de consulting.

## Notas de arquitetura

- Frontend organizado por `features/` (candidate, vacancy, kanban, talent-bank, people, onboarding, consulting, insights, weekly-report, docs, auth), cada uma com sua camada de dados (`api.ts`, hoje falando direto com `supabase.from(...)`) e hooks de React Query (`queries.ts`) — sem estado global duplicando o cache do servidor.
- `supabase/schema.sql` é a fonte da verdade do banco: tabelas, triggers de `updated_at`, políticas de RLS e buckets de storage (`resumes`, `documents`).
- Drawers/modais via Portal (`createPortal`), sempre acima do header, com scroll interno próprio e responsivos.
- UX: toasts de feedback, skeleton loading, estados vazios e de erro tratados em toda a aplicação.
- `backend/` e `mock-backend/` (NestJS/Mongo e servidor Node puro, respectivamente) foram a arquitetura original do projeto, antes da migração para Supabase — continuam no repo como referência, mas o frontend não depende mais deles.
