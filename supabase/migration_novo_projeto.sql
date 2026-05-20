-- ==========================================================
-- MIGRATION COMPLETA - TeraNexus SaaS
-- Novo Projeto: kbuknqfnhgyfywnthgyc.supabase.co
-- Execute no: Supabase Dashboard → SQL Editor → New query
-- ==========================================================

-- 1. EXTENSION
create extension if not exists "uuid-ossp";

-- ==========================================================
-- TABELA: therapists
-- ==========================================================
create table if not exists public.therapists (
  id uuid references auth.users not null primary key,
  name text not null,
  email text not null,
  phone text,
  plan text check (plan in ('free', 'pro', 'enterprise', 'trial')) default 'trial',
  active boolean default true,
  specialty text,
  is_verified boolean default false,
  rating numeric default 5.0,
  is_overflow_source boolean default false,
  is_overflow_target boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.therapists enable row level security;

drop policy if exists "Perfis públicos são visíveis por todos" on public.therapists;
drop policy if exists "Public profiles are viewable by everyone." on public.therapists;
drop policy if exists "Usuários podem inserir seu próprio perfil" on public.therapists;
drop policy if exists "Users can insert their own profile." on public.therapists;
drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.therapists;
drop policy if exists "Users can update own profile." on public.therapists;

create policy "Perfis públicos são visíveis por todos" on public.therapists
  for select using (true);

create policy "Usuários podem inserir seu próprio perfil" on public.therapists
  for insert with check (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.therapists
  for update using (auth.uid() = id);

-- Colunas extras (seguro se já existirem)
alter table public.therapists add column if not exists phone text;
alter table public.therapists add column if not exists active boolean default true;
alter table public.therapists add column if not exists specialty text;
alter table public.therapists add column if not exists is_verified boolean default false;
alter table public.therapists add column if not exists rating numeric default 5.0;
alter table public.therapists add column if not exists is_overflow_source boolean default false;
alter table public.therapists add column if not exists is_overflow_target boolean default true;
alter table public.therapists add column if not exists updated_at timestamptz default now();

-- ==========================================================
-- TABELA: site_configs
-- ==========================================================
create table if not exists public.site_configs (
  id uuid not null primary key default gen_random_uuid(),
  therapist_id uuid references auth.users(id) on delete cascade not null unique,
  subdomain text unique,
  theme jsonb default '{}'::jsonb,
  content jsonb default '{}'::jsonb,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.site_configs enable row level security;

drop policy if exists "Sites públicos visíveis por todos" on public.site_configs;
drop policy if exists "Public sites are viewable by everyone" on public.site_configs;
drop policy if exists "Usuários podem inserir seu próprio site" on public.site_configs;
drop policy if exists "Users can insert their own site" on public.site_configs;
drop policy if exists "Usuários podem atualizar seu próprio site" on public.site_configs;
drop policy if exists "Users can update their own site" on public.site_configs;

create policy "Sites públicos visíveis por todos" on public.site_configs
  for select using (true);

create policy "Usuários podem inserir seu próprio site" on public.site_configs
  for insert with check (auth.uid() = therapist_id);

create policy "Usuários podem atualizar seu próprio site" on public.site_configs
  for update using (auth.uid() = therapist_id);

create index if not exists site_configs_subdomain_idx on public.site_configs (subdomain);

-- ==========================================================
-- TABELA: patients
-- ==========================================================
create table if not exists public.patients (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  name text not null,
  email text,
  phone text,
  status text default 'active',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.patients enable row level security;

drop policy if exists "Terapeutas veem seus próprios pacientes" on public.patients;
drop policy if exists "Therapists can view their own patients." on public.patients;
drop policy if exists "Terapeutas inserem seus próprios pacientes" on public.patients;
drop policy if exists "Therapists can insert their own patients." on public.patients;
drop policy if exists "Terapeutas atualizam seus próprios pacientes" on public.patients;
drop policy if exists "Therapists can update their own patients." on public.patients;
drop policy if exists "Terapeutas deletam seus próprios pacientes" on public.patients;
drop policy if exists "Therapists can delete their own patients." on public.patients;
drop policy if exists "Service role pode inserir pacientes" on public.patients;

create policy "Terapeutas veem seus próprios pacientes" on public.patients
  for select using (auth.uid() = therapist_id);

create policy "Terapeutas inserem seus próprios pacientes" on public.patients
  for insert with check (auth.uid() = therapist_id);

create policy "Terapeutas atualizam seus próprios pacientes" on public.patients
  for update using (auth.uid() = therapist_id);

create policy "Terapeutas deletam seus próprios pacientes" on public.patients
  for delete using (auth.uid() = therapist_id);

create policy "Service role pode inserir pacientes" on public.patients
  for insert with check (true);

alter table public.patients add column if not exists updated_at timestamptz default now();

-- ==========================================================
-- TABELA: appointments
-- ==========================================================
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  patient_id uuid references public.patients(id) not null,
  date date not null,
  time time not null,
  status text default 'scheduled',
  type text,
  notes text,
  session_data jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.appointments enable row level security;

drop policy if exists "Terapeutas veem seus próprios agendamentos" on public.appointments;
drop policy if exists "Therapists can view their own appointments." on public.appointments;
drop policy if exists "Terapeutas inserem seus próprios agendamentos" on public.appointments;
drop policy if exists "Therapists can insert their own appointments." on public.appointments;
drop policy if exists "Terapeutas atualizam seus próprios agendamentos" on public.appointments;
drop policy if exists "Therapists can update their own appointments." on public.appointments;
drop policy if exists "Terapeutas deletam seus próprios agendamentos" on public.appointments;
drop policy if exists "Therapists can delete their own appointments." on public.appointments;
drop policy if exists "Service role pode inserir agendamentos" on public.appointments;

create policy "Terapeutas veem seus próprios agendamentos" on public.appointments
  for select using (auth.uid() = therapist_id);

create policy "Terapeutas inserem seus próprios agendamentos" on public.appointments
  for insert with check (auth.uid() = therapist_id);

create policy "Terapeutas atualizam seus próprios agendamentos" on public.appointments
  for update using (auth.uid() = therapist_id);

create policy "Terapeutas deletam seus próprios agendamentos" on public.appointments
  for delete using (auth.uid() = therapist_id);

create policy "Service role pode inserir agendamentos" on public.appointments
  for insert with check (true);

alter table public.appointments add column if not exists session_data jsonb default '{}'::jsonb;
alter table public.appointments add column if not exists updated_at timestamptz default now();

-- ==========================================================
-- TABELA: financial_records
-- ==========================================================
create table if not exists public.financial_records (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  patient_id uuid references public.patients(id),
  description text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  date date default current_date,
  status text default 'pending',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.financial_records enable row level security;

drop policy if exists "Terapeutas gerenciam seus próprios registros financeiros" on public.financial_records;
drop policy if exists "Therapists can view their own financial records." on public.financial_records;
drop policy if exists "Therapists can manage their own financial records." on public.financial_records;

create policy "Terapeutas gerenciam seus próprios registros financeiros" on public.financial_records
  for all using (auth.uid() = therapist_id);

alter table public.financial_records add column if not exists updated_at timestamptz default now();

-- ==========================================================
-- TABELA: referrals
-- ==========================================================
create table if not exists public.referrals (
  id uuid default uuid_generate_v4() primary key,
  source_therapist_id uuid references public.therapists(id) not null,
  target_therapist_id uuid references public.therapists(id) not null,
  patient_name text not null,
  patient_contact text not null,
  patient_needs text,
  status text check (status in ('pending', 'accepted', 'rejected', 'expired', 'booked')) default 'pending',
  session_price numeric not null,
  commission_amount numeric not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.referrals enable row level security;

drop policy if exists "Terapeuta fonte vê indicações enviadas" on public.referrals;
drop policy if exists "Source therapists can view sent referrals." on public.referrals;
drop policy if exists "Terapeuta destino vê indicações recebidas" on public.referrals;
drop policy if exists "Target therapists can view received referrals." on public.referrals;
drop policy if exists "Terapeuta destino atualiza status" on public.referrals;
drop policy if exists "Target therapists can update status." on public.referrals;
drop policy if exists "Terapeuta fonte cria indicações" on public.referrals;
drop policy if exists "Source therapists can create referrals." on public.referrals;

create policy "Terapeuta fonte vê indicações enviadas" on public.referrals
  for select using (auth.uid() = source_therapist_id);

create policy "Terapeuta destino vê indicações recebidas" on public.referrals
  for select using (auth.uid() = target_therapist_id);

create policy "Terapeuta destino atualiza status" on public.referrals
  for update using (auth.uid() = target_therapist_id);

create policy "Terapeuta fonte cria indicações" on public.referrals
  for insert with check (auth.uid() = source_therapist_id);

-- ==========================================================
-- TABELA: validation_responses
-- ==========================================================
create table if not exists public.validation_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  contact text,
  video_platform text[],
  record_method text[],
  pain_point text[],
  ai_interest text,
  digital_notebook_interest text,
  suggestions text
);

alter table public.validation_responses enable row level security;

drop policy if exists "Inserção anônima para validação" on public.validation_responses;
drop policy if exists "Permitir inserção anônima para validação" on public.validation_responses;
drop policy if exists "Leitura para usuários autenticados" on public.validation_responses;
drop policy if exists "Permitir leitura para usuários autenticados" on public.validation_responses;

create policy "Inserção anônima para validação" on public.validation_responses
  for insert to anon with check (true);

create policy "Leitura para usuários autenticados" on public.validation_responses
  for select to authenticated using (true);

-- ==========================================================
-- TRIGGER: auto-criar perfil ao cadastrar usuário
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.therapists (id, name, email, plan, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'plan', 'trial'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================
-- FIM DA MIGRATION
-- Após executar, verifique as tabelas em: Database → Tables
-- ==========================================================
