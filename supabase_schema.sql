-- =====================================================================
-- UMMATI DATABASE SCHEMA (v2)
-- Run this whole script in Supabase: Dashboard > SQL Editor > New query > Run.
-- It is idempotent: safe to run on a fresh project or on top of the v1 schema.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES (one row per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  unique_app_id uuid unique not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
-- v1 created unique_app_id without a default, which makes the signup trigger fail with a 500
alter table public.profiles alter column unique_app_id set default gen_random_uuid();
alter table public.profiles add column if not exists gender text check (gender in ('man', 'woman'));
alter table public.profiles add column if not exists avatar_color text default '#0E9F6E';
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists show_on_leaderboard boolean not null default true;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------
-- 2. USER PROGRESS (XP, streaks, Quran position)
-- ---------------------------------------------------------------------
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  streak_count integer not null default 0,
  total_xp integer not null default 0,
  last_read_surah integer,
  last_read_ayah integer,
  last_read_timestamp timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.user_progress add column if not exists best_streak integer not null default 0;
alter table public.user_progress add column if not exists last_active_date date;
alter table public.user_progress add column if not exists khatam_count integer not null default 0;
alter table public.user_progress add column if not exists ayahs_read integer not null default 0;
alter table public.user_progress add column if not exists daily_quran_goal integer not null default 10;
alter table public.user_progress enable row level security;

-- ---------------------------------------------------------------------
-- 3. USER ACTIVITIES (one row per user / type / day; details in jsonb)
--    activity_type: 'prayer' | 'quran' | 'tasbih' | 'dua' | 'kids' | 'screentime' | 'fasting'
-- ---------------------------------------------------------------------
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  activity_date date not null default current_date,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, activity_type, activity_date)
);
-- Older projects created this table without the unique key; dedupe and add it.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_activities'::regclass and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (user_id, activity_type, activity_date)'
  ) then
    delete from public.user_activities a using public.user_activities b
      where a.ctid < b.ctid and a.user_id = b.user_id
        and a.activity_type = b.activity_type and a.activity_date = b.activity_date;
    alter table public.user_activities
      add constraint user_activities_user_type_date_key unique (user_id, activity_type, activity_date);
  end if;
end $$;
alter table public.user_activities enable row level security;

-- ---------------------------------------------------------------------
-- 4. XP EVENTS (audit log so XP can't be inflated client-side unnoticed)
-- ---------------------------------------------------------------------
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount between 1 and 100),
  source text not null,
  created_at timestamptz not null default now()
);
create index if not exists xp_events_user_day on public.xp_events (user_id, created_at);
alter table public.xp_events enable row level security;

-- ---------------------------------------------------------------------
-- 5. TASBIH HISTORY & CUSTOM DHIKR
-- ---------------------------------------------------------------------
create table if not exists public.tasbih_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  phrase text not null,
  count integer not null,
  created_at timestamptz not null default now()
);
alter table public.tasbih_history enable row level security;

-- ---------------------------------------------------------------------
-- 6. QURAN BOOKMARKS
-- ---------------------------------------------------------------------
create table if not exists public.quran_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  surah integer not null check (surah between 1 and 114),
  ayah integer not null check (ayah >= 1),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, surah, ayah)
);
alter table public.quran_bookmarks enable row level security;

-- ---------------------------------------------------------------------
-- 7. MOSQUES & JAMAT TIMINGS (community directory)
-- ---------------------------------------------------------------------
create table if not exists public.mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.mosques add column if not exists osm_id text unique;
alter table public.mosques enable row level security;

create table if not exists public.mosque_timings (
  id uuid primary key default gen_random_uuid(),
  mosque_id uuid references public.mosques(id) on delete cascade unique not null,
  fajr text not null default '05:00',
  dhuhr text not null default '13:30',
  asr text not null default '17:00',
  maghrib text not null default '19:15',
  isha text not null default '20:45',
  jummah text not null default '13:30',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.mosque_timings enable row level security;

-- ---------------------------------------------------------------------
-- 8. COMMUNITY FEED (posts, likes, bookmarks, comments)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  author_name text not null,
  avatar_text text,
  avatar_color text,
  text_color text,
  content text not null check (char_length(content) between 1 and 2000),
  category text not null default 'Reflection',
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

create table if not exists public.likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.likes enable row level security;

create table if not exists public.bookmarks (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.bookmarks enable row level security;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

-- ---------------------------------------------------------------------
-- 9. DUA REQUESTS ("Pray for me" wall) + Ameens
-- ---------------------------------------------------------------------
create table if not exists public.dua_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 500),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.dua_requests enable row level security;

create table if not exists public.dua_ameens (
  request_id uuid references public.dua_requests(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
alter table public.dua_ameens enable row level security;

-- ---------------------------------------------------------------------
-- 10. GROUP KHATAM (split the 30 Juz among friends)
-- ---------------------------------------------------------------------
create table if not exists public.khatam_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid references public.profiles(id) on delete cascade not null,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.khatam_groups enable row level security;

create table if not exists public.khatam_members (
  group_id uuid references public.khatam_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.khatam_members enable row level security;

create table if not exists public.khatam_juz (
  group_id uuid references public.khatam_groups(id) on delete cascade not null,
  juz integer not null check (juz between 1 and 30),
  user_id uuid references public.profiles(id) on delete set null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (group_id, juz)
);
alter table public.khatam_juz enable row level security;

-- Helper: is the current user in this khatam group? (security definer avoids RLS recursion)
create or replace function public.is_khatam_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.khatam_members where group_id = gid and user_id = auth.uid());
$$;


-- =====================================================================
-- ROW LEVEL SECURITY POLICIES (dropped first so the script is re-runnable)
-- =====================================================================
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in (
      'profiles','user_progress','user_activities','xp_events','tasbih_history','quran_bookmarks',
      'mosques','mosque_timings','posts','likes','bookmarks','comments',
      'dua_requests','dua_ameens','khatam_groups','khatam_members','khatam_juz')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles: public read, owner write
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- Private per-user data: owner only
create policy progress_owner on public.user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activities_owner on public.user_activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy xp_events_read on public.xp_events for select using (auth.uid() = user_id);
create policy tasbih_owner on public.tasbih_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy bookmarks_quran_owner on public.quran_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mosques: public read, signed-in users contribute
create policy mosques_read on public.mosques for select using (true);
create policy mosques_insert on public.mosques for insert with check (auth.uid() = created_by);
create policy mosques_update on public.mosques for update using (auth.uid() = created_by);
create policy timings_read on public.mosque_timings for select using (true);
create policy timings_insert on public.mosque_timings for insert with check (auth.uid() = updated_by);
create policy timings_update on public.mosque_timings for update using (auth.role() = 'authenticated') with check (auth.uid() = updated_by);

-- Community feed: everyone reads, authors manage their own rows
create policy posts_read on public.posts for select using (true);
create policy posts_insert on public.posts for insert with check (auth.uid() = user_id);
create policy posts_delete on public.posts for delete using (auth.uid() = user_id);
create policy likes_read on public.likes for select using (true);
create policy likes_insert on public.likes for insert with check (auth.uid() = user_id);
create policy likes_delete on public.likes for delete using (auth.uid() = user_id);
create policy post_bookmarks_owner on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy comments_read on public.comments for select using (true);
create policy comments_insert on public.comments for insert with check (auth.uid() = user_id);
create policy comments_delete on public.comments for delete using (auth.uid() = user_id);

-- Dua wall
create policy dua_read on public.dua_requests for select using (true);
create policy dua_insert on public.dua_requests for insert with check (auth.uid() = user_id);
create policy dua_delete on public.dua_requests for delete using (auth.uid() = user_id);
create policy ameen_read on public.dua_ameens for select using (true);
create policy ameen_insert on public.dua_ameens for insert with check (auth.uid() = user_id);
create policy ameen_delete on public.dua_ameens for delete using (auth.uid() = user_id);

-- Group khatam: members see their group; anyone signed in can look up by invite code via RPC below
create policy khatam_groups_read on public.khatam_groups for select using (public.is_khatam_member(id));
create policy khatam_groups_insert on public.khatam_groups for insert with check (auth.uid() = created_by);
create policy khatam_groups_update on public.khatam_groups for update using (auth.uid() = created_by);
create policy khatam_members_read on public.khatam_members for select using (public.is_khatam_member(group_id));
create policy khatam_members_leave on public.khatam_members for delete using (auth.uid() = user_id);
create policy khatam_juz_read on public.khatam_juz for select using (public.is_khatam_member(group_id));
create policy khatam_juz_update on public.khatam_juz for update
  using (public.is_khatam_member(group_id) and (user_id is null or user_id = auth.uid()))
  with check (user_id is null or user_id = auth.uid());


-- =====================================================================
-- FUNCTIONS (RPC)
-- =====================================================================

-- Award XP atomically, update the daily streak, and cap at 500 XP per user per day.
-- p_today is the user's local date (so streaks roll over at local midnight).
drop function if exists public.award_xp(integer, text);
create or replace function public.award_xp(p_amount integer, p_source text, p_today date default current_date)
returns public.user_progress
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  -- Clamp the client date to within a day of server time
  today date := least(greatest(p_today, current_date - 1), current_date + 1);
  earned_today integer;
  grant_amount integer;
  prog public.user_progress;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'invalid amount'; end if;

  select coalesce(sum(amount), 0) into earned_today
    from public.xp_events where user_id = uid and created_at > now() - interval '24 hours';
  grant_amount := least(p_amount, 100, greatest(0, 500 - earned_today));

  insert into public.user_progress (user_id) values (uid) on conflict (user_id) do nothing;

  if grant_amount > 0 then
    insert into public.xp_events (user_id, amount, source) values (uid, grant_amount, left(p_source, 40));
  end if;

  update public.user_progress set
    total_xp = total_xp + grant_amount,
    streak_count = case
      when last_active_date = today then streak_count
      when last_active_date = today - 1 then streak_count + 1
      else 1 end,
    best_streak = greatest(best_streak, case
      when last_active_date = today then streak_count
      when last_active_date = today - 1 then streak_count + 1
      else 1 end),
    last_active_date = today,
    updated_at = now()
  where user_id = uid
  returning * into prog;

  return prog;
end $$;

-- Public leaderboard (only users who opted in). Weekly = XP earned in the last 7 days.
create or replace function public.get_leaderboard(p_period text default 'all', p_limit integer default 50)
returns table (user_id uuid, username text, avatar_color text, xp bigint, streak integer, rank bigint)
language sql stable security definer set search_path = public as $$
  with scores as (
    select p.id as user_id, p.username, p.avatar_color,
      case when p_period = 'week'
        then coalesce((select sum(e.amount) from public.xp_events e
                       where e.user_id = p.id and e.created_at > now() - interval '7 days'), 0)
        else coalesce(up.total_xp, 0) end::bigint as xp,
      coalesce(up.streak_count, 0) as streak
    from public.profiles p
    left join public.user_progress up on up.user_id = p.id
    where p.show_on_leaderboard
  )
  select user_id, username, avatar_color, xp, streak, rank() over (order by xp desc) as rank
  from scores where xp > 0 order by xp desc limit least(p_limit, 100);
$$;

-- Join a khatam group by invite code; returns the group id.
create or replace function public.join_khatam(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into gid from public.khatam_groups where invite_code = upper(trim(p_code));
  if gid is null then raise exception 'invalid invite code'; end if;
  insert into public.khatam_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;

-- Creating a group also adds the creator and seeds the 30 Juz.
create or replace function public.handle_new_khatam_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.khatam_members (group_id, user_id) values (new.id, new.created_by);
  insert into public.khatam_juz (group_id, juz) select new.id, g from generate_series(1, 30) g;
  return new;
end $$;
drop trigger if exists on_khatam_group_created on public.khatam_groups;
create trigger on_khatam_group_created after insert on public.khatam_groups
  for each row execute procedure public.handle_new_khatam_group();


-- =====================================================================
-- SIGNUP TRIGGER: create profile + progress row for each new auth user
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- Guests (anonymous sign-ins) start hidden from the leaderboard until they create an account
  insert into public.profiles (id, username, unique_app_id, gender, show_on_leaderboard)
  values (
    new.id,
    coalesce(nullif(trim(meta->>'username'), ''), 'user_' || substr(new.id::text, 1, 8)),
    gen_random_uuid(),
    case when meta->>'gender' in ('man', 'woman') then meta->>'gender' end,
    not coalesce(new.is_anonymous, false)
  )
  on conflict (id) do nothing;

  insert into public.user_progress (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill: any existing auth users without a profile/progress row
insert into public.profiles (id, username)
  select u.id, coalesce(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8))
  from auth.users u left join public.profiles p on p.id = u.id where p.id is null;
insert into public.user_progress (user_id)
  select p.id from public.profiles p left join public.user_progress up on up.user_id = p.id where up.user_id is null;


-- =====================================================================
-- COMMUNITY v3: reactions, moderation, scholars, groups, events, challenges, notifications
-- (Everything below is idempotent and re-runnable, like the rest of this script.)
-- =====================================================================

-- ---------- roles & profile extras ----------
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'scholar', 'admin'));
alter table public.profiles add column if not exists bio text check (char_length(bio) <= 160);
alter table public.profiles add column if not exists accepted_guidelines_at timestamptz;
-- Promote someone with:  update public.profiles set role = 'scholar' where username = '...';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_guest()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- ---------- groups ----------
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text check (char_length(description) <= 300),
  tint text not null default '#C2B4EC',
  is_private boolean not null default false,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now()
);
alter table public.community_groups enable row level security;

create table if not exists public.group_members (
  group_id uuid references public.community_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid() and role = 'admin');
$$;

/** Null group (main feed) or a public group or one you belong to. */
create or replace function public.can_see_group(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select gid is null
    or exists (select 1 from public.community_groups g where g.id = gid and not g.is_private)
    or public.is_group_member(gid);
$$;

create or replace function public.handle_new_community_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role) values (new.id, new.created_by, 'admin');
  return new;
end $$;
drop trigger if exists on_community_group_created on public.community_groups;
create trigger on_community_group_created after insert on public.community_groups
  for each row execute procedure public.handle_new_community_group();

-- ---------- posts / reactions / comments / duas: new columns ----------
alter table public.posts add column if not exists group_id uuid references public.community_groups(id) on delete cascade;
alter table public.posts add column if not exists attachment jsonb;  -- { type: 'ayah' | 'dua', arabic, translation, ref }
alter table public.posts add column if not exists is_hidden boolean not null default false;
alter table public.posts add column if not exists answered boolean not null default false;
alter table public.posts alter column category set default 'discuss';
update public.posts set category = 'discuss' where category not in ('discuss', 'ask', 'event', 'group');
alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check check (category in ('discuss', 'ask', 'event', 'group'));
create index if not exists posts_feed_idx on public.posts (created_at desc);
create index if not exists posts_group_idx on public.posts (group_id, created_at desc);

alter table public.likes add column if not exists kind text not null default 'mashallah';
update public.likes set kind = 'mashallah' where kind not in ('subhanallah', 'mashallah', 'jazakallah', 'ameen');
alter table public.likes drop constraint if exists likes_kind_check;
alter table public.likes add constraint likes_kind_check check (kind in ('subhanallah', 'mashallah', 'jazakallah', 'ameen'));

alter table public.comments add column if not exists is_hidden boolean not null default false;
create index if not exists comments_post_idx on public.comments (post_id, created_at);

alter table public.dua_requests add column if not exists is_hidden boolean not null default false;
alter table public.dua_requests add column if not exists answered_at timestamptz;  -- "Alhamdulillah, it was answered"

-- ---------- events ----------
create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 100),
  description text check (char_length(description) <= 1000),
  kind text not null default 'lecture' check (kind in ('lecture', 'iftar', 'jumuah', 'class', 'charity', 'social', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text not null check (char_length(location_name) between 2 and 160),
  mosque_id uuid references public.mosques(id) on delete set null,
  latitude double precision,
  longitude double precision,
  group_id uuid references public.community_groups(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete cascade not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_start_idx on public.community_events (starts_at);
alter table public.community_events enable row level security;

create table if not exists public.event_rsvps (
  event_id uuid references public.community_events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_rsvps enable row level security;

-- ---------- challenges ----------
create table if not exists public.community_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  icon text not null default 'star',      -- lucide-ish key the app maps to an icon
  goal integer not null check (goal > 0),
  unit text not null,                     -- e.g. 'times', 'pages', 'days'
  xp integer not null default 50 check (xp between 1 and 100),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (slug, starts_on)
);
alter table public.community_challenges enable row level security;

create table if not exists public.challenge_progress (
  challenge_id uuid references public.community_challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  progress integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
alter table public.challenge_progress enable row level security;

-- ---------- notifications ----------
create table if not exists public.community_notifications (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,   -- recipient
  actor_id uuid references public.profiles(id) on delete cascade,
  actor_name text,
  kind text not null check (kind in ('reaction', 'comment', 'answer', 'ameen', 'rsvp', 'group_join')),
  post_id uuid references public.posts(id) on delete cascade,
  dua_id uuid references public.dua_requests(id) on delete cascade,
  event_id uuid references public.community_events(id) on delete cascade,
  group_id uuid references public.community_groups(id) on delete cascade,
  preview text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.community_notifications (user_id, created_at desc);
alter table public.community_notifications enable row level security;

-- ---------- moderation ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('post', 'comment', 'dua', 'event')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'offensive', 'misinformation', 'harassment', 'other')),
  details text check (char_length(details) <= 300),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
alter table public.reports enable row level security;

create table if not exists public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;

create or replace function public.is_blocked(author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where blocker_id = auth.uid() and blocked_id = author);
$$;

-- Hide a target automatically once 3 different people report it.
create or replace function public.handle_new_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  select count(*) into n from public.reports
    where target_type = new.target_type and target_id = new.target_id and not resolved;
  if n >= 3 then
    if new.target_type = 'post' then update public.posts set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'comment' then update public.comments set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'dua' then update public.dua_requests set is_hidden = true where id = new.target_id;
    elsif new.target_type = 'event' then update public.community_events set is_hidden = true where id = new.target_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists on_report_created on public.reports;
create trigger on_report_created after insert on public.reports
  for each row execute procedure public.handle_new_report();

-- ---------- posting rules: no guests, no links, rate limits ----------
create or replace function public.enforce_content_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recent integer;
  body text;
begin
  if public.is_guest() then
    raise exception 'Create a free account to post in the community.';
  end if;

  -- to_jsonb(new) so one function works for tables with different columns
  body := coalesce(to_jsonb(new) ->> 'content', '') || ' ' || coalesce(to_jsonb(new) ->> 'title', '')
    || ' ' || coalesce(to_jsonb(new) ->> 'description', '');
  if body ~* '(https?://|www\.)' then
    raise exception 'Links are not allowed in community posts.';
  end if;

  if tg_table_name = 'posts' then
    select count(*) into recent from public.posts where user_id = auth.uid() and created_at > now() - interval '1 hour';
    if recent >= 10 then raise exception 'You are posting too fast. Please wait a little.'; end if;
  elsif tg_table_name = 'comments' then
    select count(*) into recent from public.comments where user_id = auth.uid() and created_at > now() - interval '1 hour';
    if recent >= 40 then raise exception 'You are commenting too fast. Please wait a little.'; end if;
  elsif tg_table_name = 'dua_requests' then
    select count(*) into recent from public.dua_requests where user_id = auth.uid() and created_at > now() - interval '1 day';
    if recent >= 5 then raise exception 'You can share up to 5 dua requests a day.'; end if;
  elsif tg_table_name = 'community_events' then
    select count(*) into recent from public.community_events where created_by = auth.uid() and created_at > now() - interval '1 day';
    if recent >= 5 then raise exception 'You can create up to 5 events a day.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists posts_rules on public.posts;
create trigger posts_rules before insert on public.posts for each row execute procedure public.enforce_content_rules();
drop trigger if exists comments_rules on public.comments;
create trigger comments_rules before insert on public.comments for each row execute procedure public.enforce_content_rules();
drop trigger if exists duas_rules on public.dua_requests;
create trigger duas_rules before insert on public.dua_requests for each row execute procedure public.enforce_content_rules();
drop trigger if exists events_rules on public.community_events;
create trigger events_rules before insert on public.community_events for each row execute procedure public.enforce_content_rules();

-- ---------- notification triggers ----------
create or replace function public.actor_name()
returns text language sql stable security definer set search_path = public as $$
  select username from public.profiles where id = auth.uid();
$$;

create or replace function public.notify_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; body text;
begin
  select user_id, left(content, 80) into owner, body from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    -- One reaction notification per actor per post
    delete from public.community_notifications where user_id = owner and actor_id = new.user_id and post_id = new.post_id and kind = 'reaction';
    insert into public.community_notifications (user_id, actor_id, actor_name, kind, post_id, preview)
      values (owner, new.user_id, public.actor_name(), 'reaction', new.post_id, new.kind || '|' || coalesce(body, ''));
  end if;
  return new;
end $$;
drop trigger if exists on_reaction on public.likes;
create trigger on_reaction after insert on public.likes for each row execute procedure public.notify_reaction();

create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; cat text; author_role text;
begin
  select user_id, category into owner, cat from public.posts where id = new.post_id;
  select role into author_role from public.profiles where id = new.user_id;
  -- A scholar replying to an "Ask" post marks it answered
  if cat = 'ask' and author_role in ('scholar', 'admin') then
    update public.posts set answered = true where id = new.post_id;
  end if;
  if owner is not null and owner <> new.user_id then
    insert into public.community_notifications (user_id, actor_id, actor_name, kind, post_id, preview)
      values (owner, new.user_id, new.author_name,
              case when cat = 'ask' and author_role in ('scholar', 'admin') then 'answer' else 'comment' end,
              new.post_id, left(new.content, 100));
  end if;
  return new;
end $$;
drop trigger if exists on_comment on public.comments;
create trigger on_comment after insert on public.comments for each row execute procedure public.notify_comment();

create or replace function public.notify_ameen()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; body text;
begin
  select user_id, left(content, 80) into owner, body from public.dua_requests where id = new.request_id;
  if owner is not null and owner <> new.user_id then
    insert into public.community_notifications (user_id, actor_id, actor_name, kind, dua_id, preview)
      values (owner, new.user_id, public.actor_name(), 'ameen', new.request_id, body);
  end if;
  return new;
end $$;
drop trigger if exists on_ameen on public.dua_ameens;
create trigger on_ameen after insert on public.dua_ameens for each row execute procedure public.notify_ameen();

create or replace function public.notify_rsvp()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; t text;
begin
  select created_by, title into owner, t from public.community_events where id = new.event_id;
  if owner is not null and owner <> new.user_id then
    insert into public.community_notifications (user_id, actor_id, actor_name, kind, event_id, preview)
      values (owner, new.user_id, public.actor_name(), 'rsvp', new.event_id, t);
  end if;
  return new;
end $$;
drop trigger if exists on_rsvp on public.event_rsvps;
create trigger on_rsvp after insert on public.event_rsvps for each row execute procedure public.notify_rsvp();

-- A khatam group is complete once all 30 Juz are done.
create or replace function public.check_khatam_complete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.khatam_juz where group_id = new.group_id and not completed) then
    update public.khatam_groups set completed_at = coalesce(completed_at, now()) where id = new.group_id;
  else
    update public.khatam_groups set completed_at = null where id = new.group_id;
  end if;
  return new;
end $$;
drop trigger if exists on_khatam_juz_update on public.khatam_juz;
create trigger on_khatam_juz_update after update of completed on public.khatam_juz
  for each row execute procedure public.check_khatam_complete();

-- ---------- policies for v3 ----------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in (
      'community_groups','group_members','community_events','event_rsvps','community_challenges',
      'challenge_progress','community_notifications','reports','blocks')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Replace v2 feed policies with moderation/group-aware versions
drop policy if exists posts_read on public.posts;
drop policy if exists posts_delete on public.posts;
drop policy if exists posts_update on public.posts;
create policy posts_read on public.posts for select
  using ((not is_hidden or user_id = auth.uid() or public.is_admin()) and public.can_see_group(group_id));
create policy posts_delete on public.posts for delete using (auth.uid() = user_id or public.is_admin());
create policy posts_update on public.posts for update using (public.is_admin());
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert
  with check (auth.uid() = user_id and (group_id is null or public.is_group_member(group_id)));

drop policy if exists likes_update on public.likes;
create policy likes_update on public.likes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists comments_read on public.comments;
drop policy if exists comments_delete on public.comments;
create policy comments_read on public.comments for select using (not is_hidden or user_id = auth.uid() or public.is_admin());
create policy comments_delete on public.comments for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists dua_read on public.dua_requests;
drop policy if exists dua_delete on public.dua_requests;
drop policy if exists dua_update on public.dua_requests;
create policy dua_read on public.dua_requests for select using (not is_hidden or user_id = auth.uid() or public.is_admin());
create policy dua_delete on public.dua_requests for delete using (auth.uid() = user_id or public.is_admin());
create policy dua_update on public.dua_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists khatam_groups_insert on public.khatam_groups;
create policy khatam_groups_insert on public.khatam_groups for insert with check (auth.uid() = created_by and not public.is_guest());
drop policy if exists khatam_groups_delete on public.khatam_groups;
create policy khatam_groups_delete on public.khatam_groups for delete using (auth.uid() = created_by);

create policy groups_read on public.community_groups for select using (not is_private or public.is_group_member(id));
create policy groups_insert on public.community_groups for insert with check (auth.uid() = created_by and not public.is_guest());
create policy groups_update on public.community_groups for update using (public.is_group_admin(id));
create policy groups_delete on public.community_groups for delete using (auth.uid() = created_by or public.is_admin());
create policy group_members_read on public.group_members for select using (public.can_see_group(group_id));
create policy group_members_leave on public.group_members for delete using (auth.uid() = user_id or public.is_group_admin(group_id));

create policy events_read on public.community_events for select
  using ((not is_hidden or created_by = auth.uid() or public.is_admin()) and public.can_see_group(group_id));
create policy events_insert on public.community_events for insert
  with check (auth.uid() = created_by and (group_id is null or public.is_group_member(group_id)));
create policy events_update on public.community_events for update using (auth.uid() = created_by);
create policy events_delete on public.community_events for delete using (auth.uid() = created_by or public.is_admin());
create policy rsvps_read on public.event_rsvps for select using (true);
create policy rsvps_insert on public.event_rsvps for insert with check (auth.uid() = user_id);
create policy rsvps_delete on public.event_rsvps for delete using (auth.uid() = user_id);

create policy challenges_read on public.community_challenges for select using (true);
create policy challenges_admin on public.community_challenges for all using (public.is_admin()) with check (public.is_admin());
create policy challenge_progress_read on public.challenge_progress for select using (true);

create policy notifications_owner on public.community_notifications for select using (auth.uid() = user_id);
create policy notifications_update on public.community_notifications for update using (auth.uid() = user_id);
create policy notifications_delete on public.community_notifications for delete using (auth.uid() = user_id);

create policy reports_insert on public.reports for insert with check (auth.uid() = reporter_id);
create policy reports_admin on public.reports for select using (public.is_admin() or auth.uid() = reporter_id);
create policy reports_admin_update on public.reports for update using (public.is_admin());

create policy blocks_owner on public.blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- ---------- RPCs ----------

-- Paged feed with reaction counts, comment counts and my state in ONE round trip.
drop function if exists public.get_feed(text, uuid, uuid, boolean, timestamptz, integer, uuid);
create or replace function public.get_feed(
  p_category text default null,
  p_group uuid default null,
  p_author uuid default null,
  p_saved boolean default false,
  p_before timestamptz default null,
  p_limit integer default 20,
  p_post uuid default null
)
returns table (
  id uuid, user_id uuid, author_name text, avatar_color text, author_role text,
  content text, category text, attachment jsonb, group_id uuid, group_name text,
  answered boolean, is_hidden boolean, created_at timestamptz,
  reactions jsonb, reaction_total bigint, comment_count bigint, my_reaction text, is_bookmarked boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.user_id, coalesce(pr.username, p.author_name), coalesce(pr.avatar_color, p.avatar_color),
    coalesce(pr.role, 'member'), p.content, p.category, p.attachment, p.group_id, g.name,
    p.answered, p.is_hidden, p.created_at,
    coalesce((select jsonb_object_agg(k.kind, k.n) from
      (select l.kind, count(*) as n from public.likes l where l.post_id = p.id group by l.kind) k), '{}'::jsonb),
    (select count(*) from public.likes l where l.post_id = p.id),
    (select count(*) from public.comments c where c.post_id = p.id and not c.is_hidden),
    (select l.kind from public.likes l where l.post_id = p.id and l.user_id = auth.uid()),
    exists (select 1 from public.bookmarks b where b.post_id = p.id and b.user_id = auth.uid())
  from public.posts p
  left join public.profiles pr on pr.id = p.user_id
  left join public.community_groups g on g.id = p.group_id
  where (not p.is_hidden or p.user_id = auth.uid())
    and public.can_see_group(p.group_id)
    and not public.is_blocked(p.user_id)
    and (p_post is null or p.id = p_post)
    and (p_category is null or p.category = p_category)
    and (p_author is null or p.user_id = p_author)
    and (not p_saved or exists (select 1 from public.bookmarks b where b.post_id = p.id and b.user_id = auth.uid()))
    and (case
          when p_group is not null then p.group_id = p_group
          when p_saved or p_author is not null or p_post is not null then true
          else p.group_id is null end)
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.get_comments(p_post uuid)
returns table (id uuid, post_id uuid, user_id uuid, author_name text, avatar_color text, author_role text,
               content text, created_at timestamptz, is_answer boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.post_id, c.user_id, coalesce(pr.username, c.author_name), pr.avatar_color, coalesce(pr.role, 'member'),
    c.content, c.created_at,
    (po.category = 'ask' and coalesce(pr.role, 'member') in ('scholar', 'admin'))
  from public.comments c
  join public.posts po on po.id = c.post_id
  left join public.profiles pr on pr.id = c.user_id
  where c.post_id = p_post
    and public.can_see_group(po.group_id)
    and (not c.is_hidden or c.user_id = auth.uid())
    and not public.is_blocked(c.user_id)
  order by (po.category = 'ask' and coalesce(pr.role, 'member') in ('scholar', 'admin')) desc, c.created_at asc;
$$;

create or replace function public.get_duas(p_before timestamptz default null, p_limit integer default 20, p_mine boolean default false)
returns table (id uuid, user_id uuid, author_name text, avatar_color text, content text, is_anonymous boolean,
               answered_at timestamptz, created_at timestamptz, ameen_count bigint, my_ameen boolean, is_mine boolean)
language sql stable security definer set search_path = public as $$
  select d.id,
    case when d.is_anonymous and d.user_id <> auth.uid() then null else d.user_id end,
    case when d.is_anonymous then null else pr.username end,
    case when d.is_anonymous then null else pr.avatar_color end,
    d.content, d.is_anonymous, d.answered_at, d.created_at,
    (select count(*) from public.dua_ameens a where a.request_id = d.id),
    exists (select 1 from public.dua_ameens a where a.request_id = d.id and a.user_id = auth.uid()),
    d.user_id = auth.uid()
  from public.dua_requests d
  left join public.profiles pr on pr.id = d.user_id
  where (not d.is_hidden or d.user_id = auth.uid())
    and not public.is_blocked(d.user_id)
    and (not p_mine or d.user_id = auth.uid())
    and (p_before is null or d.created_at < p_before)
  order by d.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.get_groups()
returns table (id uuid, name text, description text, tint text, is_private boolean, invite_code text,
               created_by uuid, created_at timestamptz, member_count bigint, post_count bigint, is_member boolean, my_role text)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.description, g.tint, g.is_private,
    case when public.is_group_member(g.id) then g.invite_code end,
    g.created_by, g.created_at,
    (select count(*) from public.group_members m where m.group_id = g.id),
    (select count(*) from public.posts p where p.group_id = g.id and not p.is_hidden),
    public.is_group_member(g.id),
    (select m.role from public.group_members m where m.group_id = g.id and m.user_id = auth.uid())
  from public.community_groups g
  where not g.is_private or public.is_group_member(g.id)
  order by public.is_group_member(g.id) desc, (select count(*) from public.group_members m where m.group_id = g.id) desc;
$$;

-- Join a public group by id, or any group by its invite code. Returns the group id.
create or replace function public.join_group(p_group uuid default null, p_code text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_code is not null then
    select id into gid from public.community_groups where invite_code = upper(trim(p_code));
  else
    select id into gid from public.community_groups where id = p_group and not is_private;
  end if;
  if gid is null then raise exception 'Group not found. Check the invite code.'; end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;

-- Upcoming events, nearest first when a location is given (distance via haversine, km).
create or replace function public.get_events(
  p_lat double precision default null, p_lng double precision default null,
  p_radius_km double precision default 50, p_group uuid default null, p_mine boolean default false
)
returns table (id uuid, title text, description text, kind text, starts_at timestamptz, ends_at timestamptz,
               location_name text, mosque_id uuid, latitude double precision, longitude double precision,
               group_id uuid, group_name text, created_by uuid, host_name text,
               rsvp_count bigint, my_rsvp boolean, distance_km double precision)
language sql stable security definer set search_path = public as $$
  select * from (
    select e.id, e.title, e.description, e.kind, e.starts_at, e.ends_at, e.location_name, e.mosque_id,
      e.latitude, e.longitude, e.group_id, g.name, e.created_by, pr.username,
      (select count(*) from public.event_rsvps r where r.event_id = e.id),
      exists (select 1 from public.event_rsvps r where r.event_id = e.id and r.user_id = auth.uid()),
      case when p_lat is null or e.latitude is null then null else
        6371 * 2 * asin(sqrt(power(sin(radians(e.latitude - p_lat) / 2), 2)
          + cos(radians(p_lat)) * cos(radians(e.latitude)) * power(sin(radians(e.longitude - p_lng) / 2), 2)))
      end as distance_km
    from public.community_events e
    left join public.community_groups g on g.id = e.group_id
    left join public.profiles pr on pr.id = e.created_by
    where coalesce(e.ends_at, e.starts_at + interval '3 hours') > now()
      and (not e.is_hidden or e.created_by = auth.uid())
      and public.can_see_group(e.group_id)
      and not public.is_blocked(e.created_by)
      and (p_group is null or e.group_id = p_group)
      and (not p_mine or e.created_by = auth.uid()
           or exists (select 1 from public.event_rsvps r where r.event_id = e.id and r.user_id = auth.uid()))
  ) x
  where p_lat is null or x.distance_km is null or x.distance_km <= p_radius_km
  order by x.starts_at asc
  limit 100;
$$;

-- Weekly challenges are created on demand, so there is always something to join.
create or replace function public.ensure_weekly_challenges()
returns void language plpgsql security definer set search_path = public as $$
declare
  wk date := date_trunc('week', current_date)::date;  -- Monday
begin
  insert into public.community_challenges (slug, title, description, icon, goal, unit, xp, starts_on, ends_on) values
    ('kahf', 'Surah Al-Kahf on Friday', 'Read Surah Al-Kahf this Friday — a light between the two Fridays.', 'book', 1, 'reading', 50, wk, wk + 6),
    ('salawat', '1,000 Salawat', 'Send blessings upon the Prophet ﷺ 1,000 times this week.', 'heart', 1000, 'salawat', 60, wk, wk + 6),
    ('quran_pages', 'Read 20 pages of Quran', 'Read 20 pages of the Quran this week.', 'book-open', 20, 'pages', 60, wk, wk + 6),
    ('fajr', 'Fajr on time, 7 days', 'Pray Fajr on time every day this week.', 'sunrise', 7, 'days', 80, wk, wk + 6),
    ('sadaqah', 'A secret sadaqah', 'Give one act of charity this week — even a smile counts.', 'gift', 1, 'act', 40, wk, wk + 6)
  on conflict (slug, starts_on) do nothing;
end $$;

create or replace function public.get_challenges()
returns table (id uuid, slug text, title text, description text, icon text, goal integer, unit text, xp integer,
               starts_on date, ends_on date, participants bigint, completed_count bigint, my_progress integer,
               my_completed_at timestamptz, joined boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.ensure_weekly_challenges();
  return query
  select c.id, c.slug, c.title, c.description, c.icon, c.goal, c.unit, c.xp, c.starts_on, c.ends_on,
    (select count(*) from public.challenge_progress cp where cp.challenge_id = c.id),
    (select count(*) from public.challenge_progress cp where cp.challenge_id = c.id and cp.completed_at is not null),
    coalesce((select cp.progress from public.challenge_progress cp where cp.challenge_id = c.id and cp.user_id = auth.uid()), 0),
    (select cp.completed_at from public.challenge_progress cp where cp.challenge_id = c.id and cp.user_id = auth.uid()),
    exists (select 1 from public.challenge_progress cp where cp.challenge_id = c.id and cp.user_id = auth.uid())
  from public.community_challenges c
  where current_date between c.starts_on and c.ends_on
  order by c.created_at;
end $$;

-- Join (p_amount = 0) or log progress. Awards the challenge XP once, on completion.
create or replace function public.log_challenge(p_challenge uuid, p_amount integer default 1)
returns public.challenge_progress
language plpgsql security definer set search_path = public as $$
declare
  ch public.community_challenges;
  rec public.challenge_progress;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into ch from public.community_challenges where id = p_challenge;
  if ch.id is null or current_date not between ch.starts_on and ch.ends_on then raise exception 'This challenge has ended.'; end if;

  insert into public.challenge_progress (challenge_id, user_id, progress)
    values (p_challenge, auth.uid(), 0) on conflict do nothing;
  update public.challenge_progress
    set progress = least(ch.goal, greatest(0, progress + coalesce(p_amount, 0))), updated_at = now()
    where challenge_id = p_challenge and user_id = auth.uid()
    returning * into rec;

  if rec.progress >= ch.goal and rec.completed_at is null then
    update public.challenge_progress set completed_at = now()
      where challenge_id = p_challenge and user_id = auth.uid() returning * into rec;
    perform public.award_xp(ch.xp, 'challenge_' || ch.slug);
  end if;
  return rec;
end $$;

create or replace function public.get_public_profile(p_user uuid)
returns table (id uuid, username text, avatar_color text, role text, bio text, created_at timestamptz,
               total_xp integer, streak_count integer, post_count bigint, is_blocked boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar_color, p.role, p.bio, p.created_at,
    case when p.show_on_leaderboard then coalesce(up.total_xp, 0) else null end,
    case when p.show_on_leaderboard then coalesce(up.streak_count, 0) else null end,
    (select count(*) from public.posts po where po.user_id = p.id and not po.is_hidden and po.group_id is null),
    public.is_blocked(p.id)
  from public.profiles p
  left join public.user_progress up on up.user_id = p.id
  where p.id = p_user;
$$;

-- Admin: open reports grouped by target, with a preview of the content.
create or replace function public.get_open_reports()
returns table (target_type text, target_id uuid, report_count bigint, reasons text[], details text[],
               preview text, author_id uuid, author_name text, is_hidden boolean, last_reported_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return query
  select r.target_type, r.target_id, count(*), array_agg(distinct r.reason), array_remove(array_agg(r.details), null),
    coalesce(po.content, co.content, du.content, ev.title),
    coalesce(po.user_id, co.user_id, du.user_id, ev.created_by),
    pr.username,
    coalesce(po.is_hidden, co.is_hidden, du.is_hidden, ev.is_hidden, false),
    max(r.created_at)
  from public.reports r
  left join public.posts po on r.target_type = 'post' and po.id = r.target_id
  left join public.comments co on r.target_type = 'comment' and co.id = r.target_id
  left join public.dua_requests du on r.target_type = 'dua' and du.id = r.target_id
  left join public.community_events ev on r.target_type = 'event' and ev.id = r.target_id
  left join public.profiles pr on pr.id = coalesce(po.user_id, co.user_id, du.user_id, ev.created_by)
  where not r.resolved
  group by r.target_type, r.target_id, po.content, co.content, du.content, ev.title,
    po.user_id, co.user_id, du.user_id, ev.created_by, pr.username, po.is_hidden, co.is_hidden, du.is_hidden, ev.is_hidden
  order by max(r.created_at) desc;
end $$;

-- Admin: 'hide' | 'restore' | 'delete' | 'dismiss' (dismiss = keep content, close reports).
create or replace function public.moderate_content(p_type text, p_id uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare tbl text;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  tbl := case p_type when 'post' then 'posts' when 'comment' then 'comments'
                     when 'dua' then 'dua_requests' when 'event' then 'community_events' end;
  if tbl is null then raise exception 'unknown type'; end if;
  if p_action = 'hide' then execute format('update public.%I set is_hidden = true where id = $1', tbl) using p_id;
  elsif p_action = 'restore' then execute format('update public.%I set is_hidden = false where id = $1', tbl) using p_id;
  elsif p_action = 'delete' then execute format('delete from public.%I where id = $1', tbl) using p_id;
  end if;
  update public.reports set resolved = true where target_type = p_type and target_id = p_id;
end $$;

create or replace function public.accept_guidelines()
returns void language sql security definer set search_path = public as $$
  update public.profiles set accepted_guidelines_at = now() where id = auth.uid();
$$;

-- ---------- realtime ----------
do $$
declare t text;
begin
  foreach t in array array['posts', 'community_notifications', 'dua_ameens', 'khatam_juz'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;
