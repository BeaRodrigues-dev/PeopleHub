-- People Hub — schema Supabase (Postgres + RLS)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com/project/_/sql/new), de uma vez só.
--
-- Este app é single-tenant: existe apenas 1 usuário (você, o HR Manager).
-- Por isso a regra de segurança (RLS) é simples: qualquer usuário
-- autenticado tem acesso total de leitura/escrita a todas as tabelas.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  responsibilities text default '',
  requirements text default '',
  department text default '',
  location text default '',
  work_model text not null default 'Híbrido',
  seniority text default '',
  status text not null default 'Aberta',
  required_skills text[] not null default '{}',
  stages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  location text,
  avatar text,
  resume_url text,
  resume_text text,
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  seniority text,
  linkedin text,
  portfolio text,
  notes text,
  vacancy_id uuid references vacancies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  vacancy_id uuid not null references vacancies(id) on delete cascade,
  current_stage text not null,
  match_score integer,
  status text not null default 'ACTIVE',
  ai_evaluation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, vacancy_id)
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  area text not null default '',
  country text not null default '',
  start_date date not null default current_date,
  manager text,
  contract text not null default 'Full-time',
  status text not null default 'Active',
  lifecycle text not null default 'Onboarding',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists onboardings (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  role text not null,
  start_date date not null default current_date,
  status text not null default 'Started',
  checklist jsonb not null,
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists consulting_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  sector text default '',
  size text default '',
  contact text default '',
  need text default '',
  status text not null default 'Pesquisado',
  value text default '',
  ai_qualification jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  text text not null,
  area text,
  source text not null default 'manual',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  file_url text not null,
  file_name text not null,
  file_type text not null default '',
  uploaded_by text not null default '',
  created_at timestamptz not null default now()
);

-- Fecha real de apertura y de cierre de cada vacante, para calcular el KPI
-- de "tiempo para cerrar" real (no la estimación heurística de IA). Se
-- agregan con ALTER porque la tabla vacancies ya pudo haber sido creada
-- antes por este mismo schema.
alter table vacancies add column if not exists opening_date date not null default current_date;
alter table vacancies add column if not exists closed_at date;

-- Fecha real de salida del colaborador, para distinguir quién sigue activo
-- de quién ya salió (se completa sola al pasar el status a "Offboarding" o
-- "Inactivo"). El motivo de salida es de texto libre, editable por quien usa
-- la app (ej. "Renuncia", "Fin de contrato", "Despido").
alter table employees add column if not exists exit_date date;
alter table employees add column if not exists exit_reason text;

-- Panel personal/de empresa: KPIs, tareas y notas 100% editables por el
-- usuario (no vienen del ATS, no se calculan solos — los crea, edita y
-- borra quien use la app, tanto para métricas propias como de la empresa).
create table if not exists custom_kpis (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value numeric not null default 0,
  unit text not null default '',
  category text not null default 'Personal',
  note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists custom_tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  category text not null default 'Personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bucket de "My Week" en el Home ('today' | 'week' | 'pending'), para que
-- las mismas tareas de custom_tasks (creadas aquí o en Analytics) se puedan
-- organizar también por día en el Home sin duplicar la lista.
alter table custom_tasks add column if not exists day text not null default 'today';

create table if not exists custom_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  category text not null default 'Personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Encuestas de clima organizacional: rondas + resultados por categoría,
-- 100% editables por el usuario, sin datos precargados.
create table if not exists climate_survey_rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  round_date date not null default current_date,
  respondents integer not null default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists climate_survey_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references climate_survey_rounds(id) on delete cascade,
  category text not null,
  score numeric not null default 0,
  comment text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agenda personal / "segunda agenda de People": eventos con fecha, 100%
-- editables, usados también para los recordatorios de la página de inicio.
create table if not exists agenda_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null default current_date,
  event_time time,
  notes text default '',
  category text not null default 'Personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vacancies_updated_at on vacancies;
create trigger trg_vacancies_updated_at before update on vacancies for each row execute function set_updated_at();

drop trigger if exists trg_candidates_updated_at on candidates;
create trigger trg_candidates_updated_at before update on candidates for each row execute function set_updated_at();

drop trigger if exists trg_applications_updated_at on applications;
create trigger trg_applications_updated_at before update on applications for each row execute function set_updated_at();

drop trigger if exists trg_employees_updated_at on employees;
create trigger trg_employees_updated_at before update on employees for each row execute function set_updated_at();

drop trigger if exists trg_onboardings_updated_at on onboardings;
create trigger trg_onboardings_updated_at before update on onboardings for each row execute function set_updated_at();

drop trigger if exists trg_consulting_leads_updated_at on consulting_leads;
create trigger trg_consulting_leads_updated_at before update on consulting_leads for each row execute function set_updated_at();

drop trigger if exists trg_custom_kpis_updated_at on custom_kpis;
create trigger trg_custom_kpis_updated_at before update on custom_kpis for each row execute function set_updated_at();

drop trigger if exists trg_custom_tasks_updated_at on custom_tasks;
create trigger trg_custom_tasks_updated_at before update on custom_tasks for each row execute function set_updated_at();

drop trigger if exists trg_custom_notes_updated_at on custom_notes;
create trigger trg_custom_notes_updated_at before update on custom_notes for each row execute function set_updated_at();

drop trigger if exists trg_climate_survey_rounds_updated_at on climate_survey_rounds;
create trigger trg_climate_survey_rounds_updated_at before update on climate_survey_rounds for each row execute function set_updated_at();

drop trigger if exists trg_climate_survey_results_updated_at on climate_survey_results;
create trigger trg_climate_survey_results_updated_at before update on climate_survey_results for each row execute function set_updated_at();

drop trigger if exists trg_agenda_events_updated_at on agenda_events;
create trigger trg_agenda_events_updated_at before update on agenda_events for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — qualquer usuário autenticado tem acesso total (app single-tenant)
-- ─────────────────────────────────────────────────────────────────────────

alter table vacancies enable row level security;
alter table candidates enable row level security;
alter table applications enable row level security;
alter table employees enable row level security;
alter table onboardings enable row level security;
alter table consulting_leads enable row level security;
alter table insights enable row level security;
alter table documents enable row level security;
alter table custom_kpis enable row level security;
alter table custom_tasks enable row level security;
alter table custom_notes enable row level security;
alter table climate_survey_rounds enable row level security;
alter table climate_survey_results enable row level security;
alter table agenda_events enable row level security;

drop policy if exists "authenticated_full_access" on vacancies;
create policy "authenticated_full_access" on vacancies for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on candidates;
create policy "authenticated_full_access" on candidates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on applications;
create policy "authenticated_full_access" on applications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on employees;
create policy "authenticated_full_access" on employees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on onboardings;
create policy "authenticated_full_access" on onboardings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on consulting_leads;
create policy "authenticated_full_access" on consulting_leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on insights;
create policy "authenticated_full_access" on insights for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on documents;
create policy "authenticated_full_access" on documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on custom_kpis;
create policy "authenticated_full_access" on custom_kpis for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on custom_tasks;
create policy "authenticated_full_access" on custom_tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on custom_notes;
create policy "authenticated_full_access" on custom_notes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on climate_survey_rounds;
create policy "authenticated_full_access" on climate_survey_rounds for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on climate_survey_results;
create policy "authenticated_full_access" on climate_survey_results for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on agenda_events;
create policy "authenticated_full_access" on agenda_events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────
-- Storage — buckets públicos para currículos e documentos
-- (públicos porque os links são abertos diretamente em nova aba; apenas
-- usuários autenticados podem enviar/apagar arquivos)
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "resumes_public_read" on storage.objects;
create policy "resumes_public_read" on storage.objects for select using (bucket_id = 'resumes');

drop policy if exists "resumes_authenticated_write" on storage.objects;
create policy "resumes_authenticated_write" on storage.objects for insert with check (bucket_id = 'resumes' and auth.role() = 'authenticated');

drop policy if exists "resumes_authenticated_delete" on storage.objects;
create policy "resumes_authenticated_delete" on storage.objects for delete using (bucket_id = 'resumes' and auth.role() = 'authenticated');

drop policy if exists "documents_public_read" on storage.objects;
create policy "documents_public_read" on storage.objects for select using (bucket_id = 'documents');

drop policy if exists "documents_authenticated_write" on storage.objects;
create policy "documents_authenticated_write" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "documents_authenticated_delete" on storage.objects;
create policy "documents_authenticated_delete" on storage.objects for delete using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────
-- Pronto! Depois de rodar este SQL:
-- 1. Vá em Authentication → Users → Add user (crie seu email/senha de login)
-- 2. Vá em Project Settings → API e copie a "Project URL" e a "anon public key"
-- 3. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend
--    (veja README.md para o passo a passo completo)
-- ─────────────────────────────────────────────────────────────────────────
