-- =====================================================================
-- UMMATI DATABASE SCHEMA SETUP
-- Copy and run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =====================================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  unique_app_id uuid unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- 2. Create User Progress Table (streaks & xp achievements)
create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  streak_count integer default 0 not null,
  total_xp integer default 0 not null,
  last_read_surah integer,
  last_read_ayah integer,
  last_read_timestamp timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for User Progress
alter table public.user_progress enable row level security;

-- 3. Create User Activities Table (daily logs for checklist prayers, quran reading etc.)
create table public.user_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null, -- 'prayer', 'quran', 'tasbih', 'dua'
  activity_date date default current_date not null,
  details jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for User Activities
alter table public.user_activities enable row level security;

-- 4. Create Tasbih History Table (detailed increments log)
create table public.tasbih_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  phrase text not null,
  count integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Tasbih History
alter table public.tasbih_history enable row level security;

-- 5. Create Mosques Table (collaborative directory)
create table public.mosques (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Mosques
alter table public.mosques enable row level security;

-- 6. Create Mosque Timings Table (Jamat timing records)
create table public.mosque_timings (
  id uuid default gen_random_uuid() primary key,
  mosque_id uuid references public.mosques(id) on delete cascade unique not null,
  fajr text default '05:00' not null,
  dhuhr text default '13:30' not null,
  asr text default '17:00' not null,
  maghrib text default '19:15' not null,
  isha text default '20:45' not null,
  jummah text default '13:30' not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Mosque Timings
alter table public.mosque_timings enable row level security;


-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Profiles Policies
create policy "Allow public read access to profiles" 
  on public.profiles for select using (true);

create policy "Allow individual user to update their own profile" 
  on public.profiles for update using (auth.uid() = id);

-- User Progress Policies
create policy "Allow users to read their own progress" 
  on public.user_progress for select using (auth.uid() = user_id);

create policy "Allow users to update their own progress" 
  on public.user_progress for update using (auth.uid() = user_id);

create policy "Allow users to insert their own progress" 
  on public.user_progress for insert with check (auth.uid() = user_id);

-- User Activities Policies
create policy "Allow users to read their own activities" 
  on public.user_activities for select using (auth.uid() = user_id);

create policy "Allow users to manage their own activities" 
  on public.user_activities for all using (auth.uid() = user_id);

-- Tasbih History Policies
create policy "Allow users to read their own tasbih history" 
  on public.tasbih_history for select using (auth.uid() = user_id);

create policy "Allow users to manage their own tasbih history" 
  on public.tasbih_history for all using (auth.uid() = user_id);

-- Mosques Policies
create policy "Allow public read access to mosques" 
  on public.mosques for select using (true);

create policy "Allow authenticated users to insert mosques" 
  on public.mosques for insert with check (auth.role() = 'authenticated');

create policy "Allow mosque creator to update details" 
  on public.mosques for update using (auth.uid() = created_by);

-- Mosque Timings Policies
create policy "Allow public read access to timings" 
  on public.mosque_timings for select using (true);

create policy "Allow authenticated users to insert/update timings" 
  on public.mosque_timings for all using (auth.role() = 'authenticated');


-- =====================================================================
-- AUTOMATIC SIGNUP TRIGGERS
-- =====================================================================

-- Define function to handle user creation trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  username_val text;
  unique_id_val uuid;
begin
  -- Retrieve user metadata passed from application signup
  username_val := new.raw_user_meta_data->>'username';
  unique_id_val := (new.raw_user_meta_data->>'unique_app_id')::uuid;
  
  -- Fallback to generating IDs if metadata is missing (e.g. test users created in console)
  if username_val is null then
    username_val := 'user_' || substr(new.id::text, 1, 8);
  end if;
  
  if unique_id_val is null then
    unique_id_val := gen_random_uuid();
  end if;

  -- Insert profile
  insert into public.profiles (id, username, unique_app_id)
  values (new.id, username_val, unique_id_val);

  -- Insert user progress row
  insert into public.user_progress (user_id, streak_count, total_xp)
  values (new.id, 0, 0);

  return new;
exception
  when others then
    return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users table
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
