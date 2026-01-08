-- Create the table for blocked time slots
create table if not exists blocked_slots (
  id uuid default uuid_generate_v4() primary key,
  therapist_id uuid references auth.users(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time text not null,
  end_time text not null,
  label text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table blocked_slots enable row level security;

-- Policy: Users can only see their own blocked slots
create policy "Users can view own blocked slots"
  on blocked_slots for select
  using (auth.uid() = therapist_id);

-- Policy: Users can insert their own blocked slots
create policy "Users can insert own blocked slots"
  on blocked_slots for insert
  with check (auth.uid() = therapist_id);

-- Policy: Users can update their own blocked slots
create policy "Users can update own blocked slots"
  on blocked_slots for update
  using (auth.uid() = therapist_id);

-- Policy: Users can delete their own blocked slots
create policy "Users can delete own blocked slots"
  on blocked_slots for delete
  using (auth.uid() = therapist_id);
