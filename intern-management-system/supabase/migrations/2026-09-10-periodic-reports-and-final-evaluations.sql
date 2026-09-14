-- Migrate: Quản lý Thời hạn Thực tập, Báo cáo Định kỳ Linh hoạt & Đánh giá Tổng quan Cuối kỳ.
-- Chạy trên Supabase Dashboard > SQL Editor (an toàn chạy lại). Đồng bộ với supabase/schema.sql.
-- Xem thêm: docs/superpowers/plans/2026-09-10-periodic-reports-and-final-evaluations.md

-- 1) Enum mới
do $$ begin
  create type public.internship_status as enum ('active', 'completed_internship');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.final_recommendation as enum ('pass', 'fail', 'offer_job');
exception when duplicate_object then null;
end $$;

-- 2) Cột thời hạn thực tập cho profiles
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

-- 3) Bảng báo cáo định kỳ (đổi tên từ weekly_reports, idempotent)
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
alter table public.periodic_reports drop constraint if exists weekly_reports_task_week_unique;

do $$ declare v_constraint text;
begin
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

create index if not exists periodic_reports_intern_period_idx on public.periodic_reports(intern_id, period_number desc);
create index if not exists periodic_reports_intern_status_idx on public.periodic_reports(intern_id, status);
create index if not exists periodic_reports_due_date_idx on public.periodic_reports(due_date);
drop index if exists weekly_reports_intern_week_idx;
drop index if exists weekly_reports_task_id_idx;
drop index if exists weekly_reports_status_idx;

-- 4) Bảng đánh giá tổng quan cuối kỳ
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

create index if not exists final_evaluations_intern_id_idx on public.final_evaluations(intern_id);

-- 5) Tự sinh các đợt báo cáo định kỳ + đánh dấu late khi quá hạn
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

-- 6) RLS cho bảng mới
alter table public.periodic_reports enable row level security;
alter table public.final_evaluations enable row level security;

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

-- 7) Realtime cho periodic_reports
do $$ begin
  alter publication supabase_realtime add table public.periodic_reports;
exception when duplicate_object then null;
end $$;