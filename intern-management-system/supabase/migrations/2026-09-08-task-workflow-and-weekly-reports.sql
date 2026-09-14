-- Migrate task workflow: chi tiết quy trình 5 trạng thái + completion_status đúng/trễ hạn
-- + bảng weekly_reports. Chạy trên Supabase Dashboard > SQL Editor (an toàn chạy lại).
-- Xem thêm: docs/superpowers/plans/2026-09-08-close-gaps-roadmap.md

-- 1) Nâng cấp enum task_status: (todo|doing|done) -> (pending_acceptance|in_progress|under_review|completed|rejected)
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
    -- (todo|doing|done) -> (pending_acceptance|in_progress|under_review|completed|rejected)
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

-- 2) Enum completion_status (đúng/trễ hạn)
do $$ begin
  create type public.task_completion_status as enum ('on_time', 'late');
exception when duplicate_object then null;
end $$;

-- 3) Cột mới cho tasks
alter table public.tasks
  add column if not exists completion_status public.task_completion_status,
  add column if not exists accepted_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists submission_url text,
  add column if not exists feedback text;

-- 4) Tự tính on_time/late khi task đạt trạng thái completed (so sánh completed_at vs deadline)
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

-- 5) Intern chỉ được cập nhật trạng thái + mốc thời gian + link kết quả của task ĐƯỢC GIAO,
--    tuân thủ state machine: pending_acceptance -> in_progress -> under_review.
--    Không được sửa title/description/priority/deadline/assignee/parent/category/creator.
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
      raise exception 'Thực tập sinh chỉ được cập nhật trạng thái công việc được giao.';
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

-- 6) Bảng báo cáo tuần
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  intern_id uuid not null references public.profiles(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  content text not null check (char_length(trim(content)) between 1 and 10000),
  attachment_url text,
  mentor_feedback text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  created_at timestamptz not null default now()
);

create index if not exists weekly_reports_intern_week_idx on public.weekly_reports(intern_id, week_number);
create index if not exists weekly_reports_task_id_idx on public.weekly_reports(task_id);
create index if not exists weekly_reports_status_idx on public.weekly_reports(status);

do $$ begin
  alter table public.weekly_reports
    add constraint weekly_reports_task_week_unique unique (task_id, week_number);
exception when duplicate_object then null;
end $$;

-- 7) RLS cho weekly_reports
alter table public.weekly_reports enable row level security;

drop policy if exists weekly_reports_select on public.weekly_reports;
create policy weekly_reports_select on public.weekly_reports
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists weekly_reports_insert on public.weekly_reports;
create policy weekly_reports_insert on public.weekly_reports
for insert to authenticated
with check (
  public.is_admin()
  or (
    intern_id = auth.uid()
    and public.current_user_role() = 'intern'::public.user_role
  )
);

drop policy if exists weekly_reports_update_mentor on public.weekly_reports;
create policy weekly_reports_update_mentor on public.weekly_reports
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
);

drop policy if exists weekly_reports_delete_admin on public.weekly_reports;
create policy weekly_reports_delete_admin on public.weekly_reports
for delete to authenticated
using (public.is_admin());

-- 8) Realtime cho weekly_reports
do $$ begin
  alter publication supabase_realtime add table public.weekly_reports;
exception when duplicate_object then null;
end $$;