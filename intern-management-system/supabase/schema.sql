-- Intern Management System - Supabase schema
-- Run the complete file in Supabase Dashboard > SQL Editor.
-- This script is safe to run again after a partial or successful run.

create extension if not exists pgcrypto;

-- Enums
 do $$ begin
  create type public.user_role as enum ('admin', 'mentor', 'intern');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_type as enum ('leave', 'wfh');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.evaluation_period as enum ('midterm', 'final');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'intern',
  avatar_url text,
  university text,
  major text,
  mentor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  priority public.task_priority not null default 'medium',
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  status public.task_status not null default 'todo',
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in_time timestamptz,
  check_out_time timestamptz,
  total_hours numeric(5, 2) check (total_hours is null or total_hours >= 0),
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'wfh')),
  created_at timestamptz not null default now(),
  unique (intern_id, date),
  check (check_out_time is null or check_in_time is not null),
  check (check_out_time is null or check_out_time >= check_in_time)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete restrict,
  type public.request_type not null,
  reason text not null check (char_length(trim(reason)) between 1 and 2000),
  start_date date not null,
  end_date date not null,
  status public.request_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete restrict,
  type_period public.evaluation_period not null,
  scores_json jsonb not null default '{}'::jsonb,
  feedback text,
  created_at timestamptz not null default now(),
  unique (intern_id, mentor_id, type_period)
);

-- Indexes
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_mentor_id_idx on public.profiles(mentor_id);
create index if not exists tasks_assignee_status_idx on public.tasks(assignee_id, status);
create index if not exists tasks_creator_id_idx on public.tasks(creator_id);
create index if not exists tasks_deadline_idx on public.tasks(deadline);
create index if not exists attendance_intern_date_idx on public.attendance(intern_id, date desc);
create index if not exists leave_requests_mentor_status_idx on public.leave_requests(mentor_id, status);
create index if not exists leave_requests_intern_status_idx on public.leave_requests(intern_id, status);
create index if not exists evaluations_intern_id_idx on public.evaluations(intern_id);

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin'::public.user_role, false);
$$;

create or replace function public.is_mentor_of(target_intern_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_intern_id
      and p.mentor_id = auth.uid()
      and p.role = 'intern'::public.user_role
  );
$$;

grant usage on schema public to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_mentor_of(uuid) to authenticated;

-- New Auth users get an Intern profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.evaluations enable row level security;

-- Profiles
 drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  public.is_admin()
  or id = auth.uid()
  or mentor_id = auth.uid()
  or (public.current_user_role() = 'intern'::public.user_role and role = 'mentor'::public.user_role)
);

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.is_admin());

-- Tasks
 drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
for select to authenticated
using (public.is_admin() or assignee_id = auth.uid() or creator_id = auth.uid() or public.is_mentor_of(assignee_id));

drop policy if exists tasks_insert_admin on public.tasks;
create policy tasks_insert_admin on public.tasks
for insert to authenticated
with check (public.is_admin());

drop policy if exists tasks_insert_mentor on public.tasks;
create policy tasks_insert_mentor on public.tasks
for insert to authenticated
with check (public.current_user_role() = 'mentor'::public.user_role and creator_id = auth.uid() and public.is_mentor_of(assignee_id));

drop policy if exists tasks_update_admin on public.tasks;
create policy tasks_update_admin on public.tasks
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists tasks_update_mentor on public.tasks;
create policy tasks_update_mentor on public.tasks
for update to authenticated
using (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(assignee_id))
with check (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(assignee_id));

drop policy if exists tasks_update_intern on public.tasks;
create policy tasks_update_intern on public.tasks
for update to authenticated
using (public.current_user_role() = 'intern'::public.user_role and assignee_id = auth.uid())
with check (public.current_user_role() = 'intern'::public.user_role and assignee_id = auth.uid());

drop policy if exists tasks_delete_admin on public.tasks;
create policy tasks_delete_admin on public.tasks
for delete to authenticated
using (public.is_admin());

-- Attendance
 drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
for insert to authenticated
with check (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role));

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
for update to authenticated
using (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role))
with check (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role));

drop policy if exists attendance_delete_admin on public.attendance;
create policy attendance_delete_admin on public.attendance
for delete to authenticated
using (public.is_admin());

-- Leave and WFH
 drop policy if exists leave_requests_select on public.leave_requests;
create policy leave_requests_select on public.leave_requests
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists leave_requests_insert on public.leave_requests;
create policy leave_requests_insert on public.leave_requests
for insert to authenticated
with check (
  public.current_user_role() = 'intern'::public.user_role
  and intern_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'intern'::public.user_role
      and p.mentor_id = leave_requests.mentor_id
  )
);

drop policy if exists leave_requests_update_admin on public.leave_requests;
create policy leave_requests_update_admin on public.leave_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists leave_requests_update_mentor on public.leave_requests;
create policy leave_requests_update_mentor on public.leave_requests
for update to authenticated
using (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid())
with check (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid());

drop policy if exists leave_requests_delete_admin on public.leave_requests;
create policy leave_requests_delete_admin on public.leave_requests
for delete to authenticated
using (public.is_admin());

-- Evaluations
 drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists evaluations_insert_admin on public.evaluations;
create policy evaluations_insert_admin on public.evaluations
for insert to authenticated
with check (public.is_admin());

drop policy if exists evaluations_insert_mentor on public.evaluations;
create policy evaluations_insert_mentor on public.evaluations
for insert to authenticated
with check (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id));

drop policy if exists evaluations_update_admin on public.evaluations;
create policy evaluations_update_admin on public.evaluations
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists evaluations_update_mentor on public.evaluations;
create policy evaluations_update_mentor on public.evaluations
for update to authenticated
using (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
with check (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id));

drop policy if exists evaluations_delete_admin on public.evaluations;
create policy evaluations_delete_admin on public.evaluations
for delete to authenticated
using (public.is_admin());

-- Storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists storage_avatars_read on storage.objects;
create policy storage_avatars_read on storage.objects
for select to authenticated
using (bucket_id = 'avatars');

drop policy if exists storage_avatars_insert on storage.objects;
create policy storage_avatars_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_avatars_update on storage.objects;
create policy storage_avatars_update on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_documents_read on storage.objects;
create policy storage_documents_read on storage.objects
for select to authenticated
using (bucket_id = 'documents' and (owner_id::text = auth.uid()::text or public.is_admin()));

drop policy if exists storage_documents_insert on storage.objects;
create policy storage_documents_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_documents_update on storage.objects;
create policy storage_documents_update on storage.objects
for update to authenticated
using (bucket_id = 'documents' and owner_id::text = auth.uid()::text)
with check (bucket_id = 'documents' and owner_id::text = auth.uid()::text);

drop policy if exists storage_documents_delete on storage.objects;
create policy storage_documents_delete on storage.objects
for delete to authenticated
using (bucket_id = 'documents' and (owner_id::text = auth.uid()::text or public.is_admin()));

-- Realtime publication. Supabase may already have these tables attached.
do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.leave_requests;
exception when duplicate_object then null;
end $$;

-- Bootstrap the first Admin. The Auth user must already exist before this runs.
update public.profiles
set role = 'admin', mentor_id = null
where lower(trim(email)) = 'nhdhuy1109@gmail.com';
