-- Create a table for public profiles (Therapists)
create table public.therapists (
  id uuid references auth.users not null primary key,
  name text not null,
  email text not null,
  plan text check (plan in ('free', 'pro', 'enterprise')) default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.therapists enable row level security;

-- Policies for Therapists
create policy "Public profiles are viewable by everyone." on public.therapists
  for select using (true);

create policy "Users can insert their own profile." on public.therapists
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.therapists
  for update using (auth.uid() = id);

-- Create a table for Patients
create table public.patients (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  name text not null,
  email text,
  phone text,
  status text default 'active',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.patients enable row level security;

-- Policies for Patients
create policy "Therapists can view their own patients." on public.patients
  for select using (auth.uid() = therapist_id);

create policy "Therapists can insert their own patients." on public.patients
  for insert with check (auth.uid() = therapist_id);

create policy "Therapists can update their own patients." on public.patients
  for update using (auth.uid() = therapist_id);

create policy "Therapists can delete their own patients." on public.patients
  for delete using (auth.uid() = therapist_id);

-- Create a table for Appointments
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  patient_id uuid references public.patients(id) not null,
  date date not null,
  time time not null,
  status text default 'scheduled',
  type text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.appointments enable row level security;

-- Policies for Appointments
create policy "Therapists can view their own appointments." on public.appointments
  for select using (auth.uid() = therapist_id);

create policy "Therapists can insert their own appointments." on public.appointments
  for insert with check (auth.uid() = therapist_id);

create policy "Therapists can update their own appointments." on public.appointments
  for update using (auth.uid() = therapist_id);

create policy "Therapists can delete their own appointments." on public.appointments
  for delete using (auth.uid() = therapist_id);

-- Create a table for Financial Records
create table public.financial_records (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references public.therapists(id) not null,
  patient_id uuid references public.patients(id),
  description text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  date date default current_date,
  status text default 'pending', -- paid, pending, overdue
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.financial_records enable row level security;

-- Policies for Financial Records
create policy "Therapists can view their own financial records." on public.financial_records
  for select using (auth.uid() = therapist_id);

create policy "Therapists can manage their own financial records." on public.financial_records
  for all using (auth.uid() = therapist_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.therapists (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- [THERAPY NETWORK / TRANSBORDO FEATURES]

-- 5. Update Therapists Table with Network Columns
-- Note: Run 'ALTER TABLE' manually if table exists
/*
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS is_verified boolean default false,
ADD COLUMN IF NOT EXISTS rating numeric default 5.0,
ADD COLUMN IF NOT EXISTS is_overflow_source boolean default false, -- "Fechei agenda, manda pro parceiro"
ADD COLUMN IF NOT EXISTS is_overflow_target boolean default true;  -- "Aceito receber pacientes"
*/

-- 6. Create Referrals Table
create table if not exists public.referrals (
  id uuid default uuid_generate_v4() primary key,
  source_therapist_id uuid references public.therapists(id) not null,
  target_therapist_id uuid references public.therapists(id) not null,
  patient_name text not null,
  patient_contact text not null, -- WhatsApp/Email
  patient_needs text, -- Specialty or specific notes
  status text check (status in ('pending', 'accepted', 'rejected', 'expired', 'booked')) default 'pending',
  session_price numeric not null,
  commission_amount numeric not null, -- The split amount
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Referrals
alter table public.referrals enable row level security;

-- Policies for Referrals
-- Source Therapist can view referrals they sent
create policy "Source therapists can view sent referrals." on public.referrals
  for select using (auth.uid() = source_therapist_id);

-- Target Therapist can view referrals sent to them
create policy "Target therapists can view received referrals." on public.referrals
  for select using (auth.uid() = target_therapist_id);

-- Target Therapist can update status (Accept/Reject)
create policy "Target therapists can update status." on public.referrals
  for update using (auth.uid() = target_therapist_id);

-- Source Therapist can create referrals
create policy "Source therapists can create referrals." on public.referrals
  for insert with check (auth.uid() = source_therapist_id);
