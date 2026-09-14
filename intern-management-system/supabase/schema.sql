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

do $$
begin
  if not exists (
    select 1 from pg_type t
    where t.typname = 'task_status' and t.typnamespace = 'public'::regnamespace
  ) then
    create type public.task_status as enum (
      'pending_acceptance', 'in_progress', 'under_review', 'completed', 'rejected'
    );
  elsif not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'task_status' and e.enumlabel = 'in_progress'
  ) then
    begin
      create type public.task_status_v2 as enum (
        'pending_acceptance', 'in_progress', 'under_review', 'completed', 'rejected'
      );
    exception when duplicate_object then null;
    end;
    alter table public.tasks
      alter column status drop default,
      alter column status type public.task_status_v2 using (
        case status::text
          when 'todo' then 'pending_acceptance'::public.task_status_v2
          when 'doing' then 'in_progress'::public.task_status_v2
          when 'done' then 'completed'::public.task_status_v2
          else 'pending_acceptance'::public.task_status_v2
        end
      ),
      alter column status set default 'pending_acceptance'::public.task_status_v2;
    drop type public.task_status;
    alter type public.task_status_v2 rename to task_status;
  end if;
end $$;

do $$ begin
  create type public.task_completion_status as enum ('on_time', 'late');
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

do $$ begin
  create type public.internship_status as enum ('active', 'completed_internship');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.final_recommendation as enum ('pass', 'fail', 'offer_job');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'intern',
  avatar_url text,
  university text,
  major text,
  department_id uuid references public.departments(id) on delete set null,
  mentor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  category text,
  priority public.task_priority not null default 'medium',
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  parent_task_id uuid references public.tasks(id) on delete set null,
  status public.task_status not null default 'pending_acceptance',
  completion_status public.task_completion_status,
  accepted_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  submission_url text,
  feedback text,
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_task_id is null or parent_task_id <> id)
);

-- Báo cáo tiến độ định kỳ (đợt nộp theo thời hạn thực tập). Đổi tên từ weekly_reports (idempotent).
do $$ begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'weekly_reports')
     and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'periodic_reports') then
    alter table public.weekly_reports rename to periodic_reports;
  end if;
end $$;

create table if not exists public.periodic_reports (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  period_number integer,
  due_date date,
  submitted_at timestamptz,
  content text check (char_length(trim(content)) between 1 and 10000),
  attachment_url text,
  mentor_feedback text,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'late', 'reviewed')),
  created_at timestamptz not null default now()
);

-- Align nếu bảng được đổi tên từ bố cục weekly_reports cũ.
alter table public.periodic_reports
  add column if not exists period_number integer,
  add column if not exists due_date date,
  add column if not exists submitted_at timestamptz,
  alter column task_id drop not null,
  alter column content drop not null,
  alter column status set default 'pending';

-- week_number chỉ tồn tại khi bảng được rename từ weekly_reports cũ; đảm bảo cột có mặt
-- để lệnh align bên dưới không lỗi trên DB mới (chạy lại an toàn).
alter table public.periodic_reports add column if not exists week_number integer;

update public.periodic_reports
   set period_number = week_number,
       due_date = coalesce(due_date, created_at::date)
 where period_number is null
   and week_number is not null;

alter table public.periodic_reports drop column if exists week_number;

alter table public.periodic_reports drop constraint if exists weekly_reports_task_id_week_number_key;

do $$ declare v_constraint text;
begin
  -- Drop check cú status cũ (submitted|reviewed, không có tên).
  select conname into v_constraint
    from pg_constraint
   where conrelid = 'public.periodic_reports'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%submitted%'
   limit 1;
  if v_constraint is not null then
    execute format('alter table public.periodic_reports drop constraint %I', v_constraint);
  end if;
end $$;

do $$ begin
  alter table public.periodic_reports
    add constraint periodic_reports_status_check check (status in ('pending', 'submitted', 'late', 'reviewed'));
exception when duplicate_object then null;
end $$;

-- Unique (intern_id, period_number): dùng kiểm tra tồn tại vì duplicate_object (42710)
-- không bắt được duplicate_relation (42P07) khi unique constraint đã có.
do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.periodic_reports'::regclass
       and conname = 'periodic_reports_unique_period'
  ) then
    alter table public.periodic_reports
      add constraint periodic_reports_unique_period unique (intern_id, period_number);
  end if;
end $$;

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

create table if not exists public.final_evaluations (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete restrict,
  overall_score numeric(3, 1) check (overall_score between 0 and 10),
  grade text check (grade in ('A', 'B', 'C', 'D')),
  work_attitude_score numeric(3, 1) check (work_attitude_score between 0 and 10),
  skill_score numeric(3, 1) check (skill_score between 0 and 10),
  general_feedback text check (char_length(general_feedback) <= 5000),
  recommendation public.final_recommendation not null,
  created_at timestamptz not null default now(),
  unique (intern_id),
  check (overall_score is not null or grade is not null)
);

-- Migration safety: add columns introduced after the initial deploy so this
-- script can be re-run on an existing database (create table if not exists
-- skips already-existing tables).
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

alter table public.profiles
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists report_interval_days integer,
  add column if not exists internship_status public.internship_status not null default 'active';

do $$ begin
  alter table public.profiles add constraint profiles_dates_check check (end_date is null or start_date is null or end_date >= start_date);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profiles add constraint profiles_report_interval_days_check check (report_interval_days is null or report_interval_days in (7, 10, 30));
exception when duplicate_object then null;
end $$;

alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists category text,
  add column if not exists completion_status public.task_completion_status,
  add column if not exists accepted_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists submission_url text,
  add column if not exists feedback text;

do $$ begin
  alter table public.tasks add constraint tasks_parent_not_self check (parent_task_id is null or parent_task_id <> id);
exception when duplicate_object then null;
end $$;

-- Indexes
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_mentor_id_idx on public.profiles(mentor_id);
create index if not exists profiles_department_id_idx on public.profiles(department_id);
create index if not exists tasks_assignee_status_idx on public.tasks(assignee_id, status);
create index if not exists tasks_creator_id_idx on public.tasks(creator_id);
create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);
create index if not exists tasks_deadline_idx on public.tasks(deadline);
create index if not exists attendance_intern_date_idx on public.attendance(intern_id, date desc);
create index if not exists leave_requests_mentor_status_idx on public.leave_requests(mentor_id, status);
create index if not exists leave_requests_intern_status_idx on public.leave_requests(intern_id, status);
create index if not exists leave_requests_status_idx on public.leave_requests(status);
create index if not exists evaluations_intern_id_idx on public.evaluations(intern_id);
create index if not exists periodic_reports_intern_period_idx on public.periodic_reports(intern_id, period_number desc);
create index if not exists periodic_reports_intern_status_idx on public.periodic_reports(intern_id, status);
create index if not exists periodic_reports_due_date_idx on public.periodic_reports(due_date);
create index if not exists final_evaluations_intern_id_idx on public.final_evaluations(intern_id);
drop index if exists weekly_reports_intern_week_idx;
drop index if exists weekly_reports_task_id_idx;
drop index if exists weekly_reports_status_idx;

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

-- Tự tính on_time/late khi task đạt trạng thái completed (so sánh completed_at vs deadline).
create or replace function public.tasks_set_completion_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'completed'::public.task_status then
    new.completion_status := case
      when new.deadline is null then null
      when coalesce(new.completed_at, now()) <= new.deadline then 'on_time'::public.task_completion_status
      else 'late'::public.task_completion_status
    end;
  else
    new.completion_status := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_set_completion_status on public.tasks;
create trigger tasks_set_completion_status
before insert or update on public.tasks
for each row execute function public.tasks_set_completion_status();

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

-- Tự sinh các đợt báo cáo định kỳ (pending) theo thời hạn thực tập và
-- đánh dấu 'late' khi đã quá hạn nộp. Gọi từ action logic + trigger khi đổi thời hạn.
create or replace function public.ensure_periodic_reports(p_intern_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_start date;
  v_end date;
  v_interval integer;
  v_period integer;
  v_due date;
begin
  if p_intern_id is null then return; end if;

  select p.role, p.start_date, p.end_date, p.report_interval_days
    into v_role, v_start, v_end, v_interval
  from public.profiles p
  where p.id = p_intern_id;

  if v_role <> 'intern'::public.user_role then return; end if;
  if v_start is null or v_end is null or v_interval is null or v_interval <= 0 then return; end if;

  v_period := 1;
  v_due := v_start;
  while v_due <= v_end and v_period <= 520 loop
    insert into public.periodic_reports (intern_id, period_number, due_date, status)
    values (p_intern_id, v_period, v_due, 'pending')
    on conflict (intern_id, period_number) do nothing;

    v_period := v_period + 1;
    v_due := v_start + ((v_period - 1) * v_interval);
  end loop;

update public.periodic_reports
     set status = 'late'
   where intern_id = p_intern_id
     and status = 'pending'
     and due_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date;
end;
$$;

create or replace function public.profiles_sync_periodic_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'intern'::public.user_role then
    perform public.ensure_periodic_reports(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_periodic_reports on public.profiles;
create trigger profiles_sync_periodic_reports
after insert or update of start_date, end_date, report_interval_days, role on public.profiles
for each row execute function public.profiles_sync_periodic_reports();

-- Sau khi Mentor lưu Đánh giá Tổng quan cuối kỳ, intern hoàn thành thực tập
-- và được mở khóa Giấy chứng nhận.
create or replace function public.final_evaluations_complete_internship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set internship_status = 'completed_internship'::public.internship_status
   where id = new.intern_id;
  return new;
end;
$$;

drop trigger if exists final_evaluations_complete_internship on public.final_evaluations;
create trigger final_evaluations_complete_internship
after insert or update on public.final_evaluations
for each row execute function public.final_evaluations_complete_internship();

grant execute on function public.ensure_periodic_reports(uuid) to authenticated;

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
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Thực tập sinh'),
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

-- Interns cannot re-assign their own mentor (mentor assignment is Admin-only).
create or replace function public.prevent_intern_mentor_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  select p.role into v_role from public.profiles p where p.id = auth.uid();
  if v_role = 'intern'::public.user_role and new.mentor_id is distinct from old.mentor_id then
    raise exception 'Thực tập sinh không được tự thay đổi Mentor phụ trách.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_intern_mentor_edit on public.profiles;
create trigger profiles_no_intern_mentor_edit
before update on public.profiles
for each row execute function public.prevent_intern_mentor_self_edit();

-- Interns may only step their assigned tasks through the workflow and set the
-- workflow timestamps/submission link. They may not edit the task content, and
-- the transition must follow: pending_acceptance -> in_progress -> under_review.
create or replace function public.prevent_intern_task_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  select p.role into v_role from public.profiles p where p.id = auth.uid();
  if v_role = 'intern'::public.user_role and new.assignee_id = auth.uid() then
    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.priority is distinct from old.priority
      or new.creator_id is distinct from old.creator_id
      or new.deadline is distinct from old.deadline
      or new.parent_task_id is distinct from old.parent_task_id
      or new.category is distinct from old.category
    then
      raise exception 'Thực tập sinh chỉ được cập nhật trạng thái công việc.';
    end if;
    if new.status is distinct from old.status then
      if old.status = 'pending_acceptance'::public.task_status
        and new.status = 'in_progress'::public.task_status
      then
        if new.accepted_at is null then
          raise exception 'Thiếu mốc thời gian chấp nhận công việc.';
        end if;
      elsif old.status = 'in_progress'::public.task_status
        and new.status = 'under_review'::public.task_status
      then
        if new.submitted_at is null then
          raise exception 'Thiếu mốc thời gian nộp bài.';
        end if;
      else
        raise exception 'Luồng trạng thái công việc không hợp lệ.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_no_intern_edit on public.tasks;
create trigger tasks_no_intern_edit
before update on public.tasks
for each row execute function public.prevent_intern_task_edit();

-- RLS
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.evaluations enable row level security;
alter table public.periodic_reports enable row level security;
alter table public.final_evaluations enable row level security;

-- Departments
drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments
for select to authenticated
using (true);

drop policy if exists departments_insert_admin on public.departments;
create policy departments_insert_admin on public.departments
for insert to authenticated
with check (public.is_admin());

drop policy if exists departments_update_admin on public.departments;
create policy departments_update_admin on public.departments
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists departments_delete_admin on public.departments;
create policy departments_delete_admin on public.departments
for delete to authenticated
using (public.is_admin());

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
with check (
  public.is_admin()
  or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role)
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
);

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
for update to authenticated
using (
  public.is_admin()
  or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role)
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role)
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
);

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
  public.is_admin()
  or (
    public.current_user_role() = 'intern'::public.user_role
    and intern_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'intern'::public.user_role
        and p.mentor_id = leave_requests.mentor_id
    )
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

-- Periodic reports
drop policy if exists weekly_reports_select on public.periodic_reports;
drop policy if exists weekly_reports_insert on public.periodic_reports;
drop policy if exists weekly_reports_update_mentor on public.periodic_reports;
drop policy if exists weekly_reports_delete_admin on public.periodic_reports;
drop policy if exists periodic_reports_select on public.periodic_reports;
create policy periodic_reports_select on public.periodic_reports
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists periodic_reports_insert on public.periodic_reports;
create policy periodic_reports_insert on public.periodic_reports
for insert to authenticated
with check (
  public.is_admin()
  or (
    intern_id = auth.uid()
    and public.current_user_role() = 'intern'::public.user_role
  )
);

drop policy if exists periodic_reports_update_intern on public.periodic_reports;
create policy periodic_reports_update_intern on public.periodic_reports
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and intern_id = auth.uid())
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and intern_id = auth.uid())
);

drop policy if exists periodic_reports_update_mentor on public.periodic_reports;
create policy periodic_reports_update_mentor on public.periodic_reports
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
);

drop policy if exists periodic_reports_delete_admin on public.periodic_reports;
create policy periodic_reports_delete_admin on public.periodic_reports
for delete to authenticated
using (public.is_admin());

-- Final evaluations
drop policy if exists final_evaluations_select on public.final_evaluations;
create policy final_evaluations_select on public.final_evaluations
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists final_evaluations_insert_mentor on public.final_evaluations;
create policy final_evaluations_insert_mentor on public.final_evaluations
for insert to authenticated
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
);

drop policy if exists final_evaluations_update_mentor on public.final_evaluations;
create policy final_evaluations_update_mentor on public.final_evaluations
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
);

drop policy if exists final_evaluations_delete_admin on public.final_evaluations;
create policy final_evaluations_delete_admin on public.final_evaluations
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

drop policy if exists storage_avatars_delete on storage.objects;
create policy storage_avatars_delete on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists storage_documents_read on storage.objects;
create policy storage_documents_read on storage.objects
for select to authenticated
using (
  bucket_id = 'documents'
  and (
    owner_id::text = auth.uid()::text
    or public.is_admin()
    or public.is_mentor_of(owner_id::uuid)
  )
);

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

do $$ begin
  alter publication supabase_realtime add table public.periodic_reports;
exception when duplicate_object then null;
end $$;

-- Bootstrap the first Admin. The Auth user must already exist before this runs.
update public.profiles
set role = 'admin', mentor_id = null
where lower(trim(email)) = 'nhdhuy1109@gmail.com';

-- Seed default departments (Administrators can manage these later from Settings).
insert into public.departments (name)
select unnest(array[
  'Khoa Công nghệ Thông tin',
  'Khoa Khoa học Máy tính',
  'Khoa Kỹ thuật Phần mềm',
  'Khoa Mạng máy tính & Truyền thông',
  'Trung tâm CNTT'
])
on conflict (name) do nothing;
