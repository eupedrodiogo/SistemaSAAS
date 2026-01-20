-- Create site_configs table
create table if not exists public.site_configs (
  id uuid not null primary key default gen_random_uuid(),
  therapist_id uuid references auth.users(id) on delete cascade not null unique,
  subdomain text unique, -- e.g. 'dr-ricardo'
  theme jsonb default '{}'::jsonb, -- dynamic theme settings
  content jsonb default '{}'::jsonb, -- dynamic content (hero text, bio, etc)
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.site_configs enable row level security;

-- Everyone can read published sites
create policy "Public sites are viewable by everyone"
  on public.site_configs for select
  using ( true );

-- Therapists can insert their own site
create policy "Users can insert their own site"
  on public.site_configs for insert
  with check ( auth.uid() = therapist_id );

-- Therapists can update their own site
create policy "Users can update their own site"
  on public.site_configs for update
  using ( auth.uid() = therapist_id );

-- Optional: Create index on subdomain for faster lookups
create index if not exists site_configs_subdomain_idx on public.site_configs (subdomain);
