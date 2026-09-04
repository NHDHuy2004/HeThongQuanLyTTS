-- Intern Management System schema
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'mentor', 'intern');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('todo', 'doing', 'done');
create type public.request_type as enum ('leave', 'wfh');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.evaluation_period as enum ('midterm', 'final');

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

create index if not exists profiles_mentor_id_idx on public.profiles(mentor_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists tasks_assignee_status_idx on public.tasks(assignee_id, status);
create index if not exists tasks_creator_id_idx on public.tasks(creator_id);
create index if not exists tasks_deadline_idx on public.tasks(deadline);
create index if not exists attendance_intern_date_idx on public.attendance(intern_id, date desc);
create index if not exists leave_requests_mentor_status_idx on public.leave_requests(mentor_id, status);
create index if not exists leave_requests_intern_status_idx on public.leave_requests(intern_id, status);
create index if not exists evaluations_intern_id_idx on public.evaluations(intern_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
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
    from public.profiles
    where id = target_intern_id
      and mentor_id = auth.uid()
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_mentor_of(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.evaluations enable row level security;

-- Profiles
create policy profiles_select on public.profiles
for select to authenticated
using (
  public.is_admin()
  or id = auth.uid()
  or mentor_id = auth.uid()
);

create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.is_admin());

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.is_admin());

-- Tasks
create policy tasks_select on public.tasks
for select to authenticated
using (
  public.is_admin()
  or assignee_id = auth.uid()
  or creator_id = auth.uid()
  or public.is_mentor_of(assignee_id)
);

create policy tasks_insert_admin on public.tasks
for insert to authenticated
with check (public.is_admin());

create policy tasks_insert_mentor on public.tasks
for insert to authenticated
with check (
  public.current_user_role() = 'mentor'
  and creator_id = auth.uid()
  and public.is_mentor_of(assignee_id)
);

create policy tasks_update_admin on public.tasks
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tasks_update_mentor on public.tasks
for update to authenticated
using (public.current_user_role() = 'mentor' and public.is_mentor_of(assignee_id))
with check (public.current_user_role() = 'mentor' and public.is_mentor_of(assignee_id));

create policy tasks_update_intern on public.tasks
for update to authenticated
using (public.current_user_role() = 'intern' and assignee_id = auth.uid())
with check (public.current_user_role() = 'intern' and assignee_id = auth.uid());

create policy tasks_delete_admin on public.tasks
for delete to authenticated
using (public.is_admin());

-- Attendance
create policy attendance_select on public.attendance
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

create policy attendance_insert on public.attendance
for insert to authenticated
with check (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'));

create policy attendance_update on public.attendance
for update to authenticated
using (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'))
with check (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'));

create policy attendance_delete_admin on public.attendance
for delete to authenticated
using (public.is_admin());

-- Leave and WFH requests
create policy leave_requests_select on public.leave_requests
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or mentor_id = auth.uid());

create policy leave_requests_insert on public.leave_requests
for insert to authenticated
with check (
  public.current_user_role() = 'intern'
  and intern_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and mentor_id = leave_requests.mentor_id
  )
);

create policy leave_requests_update_admin on public.leave_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy leave_requests_update_mentor on public.leave_requests
for update to authenticated
using (public.current_user_role() = 'mentor' and mentor_id = auth.uid())
with check (public.current_user_role() = 'mentor' and mentor_id = auth.uid());

create policy leave_requests_delete_admin on public.leave_requests
for delete to authenticated
using (public.is_admin());

-- Evaluations
create policy evaluations_select on public.evaluations
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or mentor_id = auth.uid());

create policy evaluations_insert_admin on public.evaluations
for insert to authenticated
with check (public.is_admin());

create policy evaluations_insert_mentor on public.evaluations
for insert to authenticated
with check (public.current_user_role() = 'mentor' and mentor_id = auth.uid() and public.is_mentor_of(intern_id));

create policy evaluations_update_admin on public.evaluations
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy evaluations_update_mentor on public.evaluations
for update to authenticated
using (public.current_user_role() = 'mentor' and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
with check (public.current_user_role() = 'mentor' and mentor_id = auth.uid() and public.is_mentor_of(intern_id));

create policy evaluations_delete_admin on public.evaluations
for delete to authenticated
using (public.is_admin());

-- Automatically create a basic profile after Supabase Auth signup.
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
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Storage buckets. File path convention: <auth.uid()>/<filename>
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('documents', 'documents', false)
on conflict (id) do nothing;

create policy storage_avatars_read on storage.objects
for select to authenticated
using (bucket_id = 'avatars');

create policy storage_avatars_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy storage_avatars_update on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy storage_documents_read on storage.objects
for select to authenticated
using (
  bucket_id = 'documents'
  and (owner_id = auth.uid() or public.is_admin() or public.is_mentor_of((storage.foldername(name))[1]::uuid))
);

create policy storage_documents_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy storage_documents_update on storage.objects
for update to authenticated
using (bucket_id = 'documents' and owner_id = auth.uid())
with check (bucket_id = 'documents' and owner_id = auth.uid());

create policy storage_documents_delete on storage.objects
for delete to authenticated
using (bucket_id = 'documents' and (owner_id = auth.uid() or public.is_admin()));
