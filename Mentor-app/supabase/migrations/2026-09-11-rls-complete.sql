-- RLS + Bảo mật Hoàn chỉnh - HeThongQuanLyTTS (dùng chung cả Mentor App + Dashboard Admin/Intern)
-- Chạy trên Supabase Dashboard > SQL Editor. AN TOÀN chạy lại (idempotent: drop policy + create).
-- Mô hình quyền:
--   admin  : toàn quyền mọi bảng.
--   mentor : xem/quản lý dữ liệu của đúng các thực tập sinh được gán (mentor_id = self).
--   intern : chỉ thao tác dữ liệu của chính mình (task được giao, đơn, báo cáo, điểm danh, đánh giá, hồ sơ).
--   anon   : không có quyền đọc bảng dữ liệu nội bộ (RLS mặc định chặn).

-- ============================================================
-- 0) Tiện ích
-- ============================================================
do $$ begin
  create extension if not exists pgcrypto;
end $$;

revoke all on schema public from public;
grant usage on schema public to authenticated;

-- ============================================================
-- 1) Helper hàm (security definer để tránh RLS đệ quy)
-- ============================================================
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
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'::public.user_role
  );
$$;

create or replace function public.is_mentor_of(target_intern_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = target_intern_id
        and p.role = 'intern'::public.user_role
        and p.mentor_id = auth.uid()
    );
$$;

create or replace function public.get_my_mentor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.mentor_id from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_mentor_of(uuid) from public;
revoke all on function public.get_my_mentor_id() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_mentor_of(uuid) to authenticated;
grant execute on function public.get_my_mentor_id() to authenticated;

-- ============================================================
-- 2) Trigger: updated_at + tự tạo profile khi đăng ký
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  -- Quy định: BẮT BUỘC dùng Họ và tên chính chủ.
  -- KHÔNG dùng kỹ thuật cắt chuỗi email (split_part) dưới bất kỳ hình thức nào.
  -- Ưu tiên: full_name (đăng ký qua Form) -> name (đăng nhập qua Google/OAuth) -> 'Chưa cập nhật'.
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    'Chưa cập nhật'
  );

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    v_full_name,
    'intern'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- 3) profiles
-- ============================================================
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Chặn tự thay đổi các trường quản trị của chính mình (chống leo quyền)
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.user_role;
begin
  select role into v_actor from public.profiles where id = auth.uid();
  if new.id = auth.uid() and coalesce(v_actor, 'intern'::public.user_role) <> 'admin'::public.user_role then
    if new.role is distinct from old.role
      or new.mentor_id is distinct from old.mentor_id
      or new.internship_status is distinct from old.internship_status
      or new.start_date is distinct from old.start_date
      or new.end_date is distinct from old.end_date
      or new.department_id is distinct from old.department_id
      or new.report_interval_days is distinct from old.report_interval_days then
      raise exception 'Khong duoc tu thay doi thong tin quan ly cua chinh minh.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_role_escalation on public.profiles;
create trigger profiles_no_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  public.is_admin()
  or id = auth.uid()
  or (role = 'intern'::public.user_role and public.is_mentor_of(id))
  or (role = 'mentor'::public.user_role and mentor_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role)
);

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (public.is_admin() or id = auth.uid())
with check (public.is_admin() or id = auth.uid());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.is_admin());

-- ============================================================
-- 4) departments
-- ============================================================
alter table public.departments enable row level security;
revoke all on public.departments from anon;
grant select, insert, update, delete on public.departments to authenticated;

drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments
for select to authenticated
using (true);

drop policy if exists departments_write_admin on public.departments;
create policy departments_write_admin on public.departments
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

-- ============================================================
-- 5) tasks
-- ============================================================
alter table public.tasks enable row level security;
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and assignee_id = auth.uid())
  or creator_id = auth.uid()
  or public.is_mentor_of(assignee_id)
);

drop policy if exists tasks_insert_mentor on public.tasks;
create policy tasks_insert_mentor on public.tasks
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.current_user_role() in ('mentor'::public.user_role, 'admin'::public.user_role)
    and creator_id = auth.uid()
    and public.is_mentor_of(assignee_id)
  )
  or (
    public.current_user_role() = 'intern'::public.user_role
    and assignee_id = auth.uid()
    and parent_task_id is not null
    and exists (
      select 1 from public.tasks t
      where t.id = parent_task_id and t.assignee_id = auth.uid()
    )
  )
);

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and assignee_id = auth.uid())
  or creator_id = auth.uid()
  or public.is_mentor_of(assignee_id)
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and assignee_id = auth.uid())
  or creator_id = auth.uid()
  or public.is_mentor_of(assignee_id)
);

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
for delete to authenticated
using (public.is_admin() or creator_id = auth.uid());

-- ============================================================
-- 6) periodic_reports (đã có RLS ở migration 2 - giữ lại + bổ sung trigger chống sửa ment-feedback)
-- ============================================================
-- Chặn intern sửa mentor_feedback / tự đổi intern_id / tự chuyển trạng thái không hợp lệ
create or replace function public.prevent_intern_report_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'intern'::public.user_role
     and new.intern_id = auth.uid()
  then
    if new.intern_id is distinct from old.intern_id
       or new.mentor_feedback is distinct from old.mentor_feedback
    then
      raise exception 'Thuc tap sinh khong duoc sua mentor_feedback hoac doi sinh vien.';
    end if;
    if new.status is distinct from old.status then
      if old.status = 'pending' and new.status = 'submitted' then
        if new.submitted_at is null then
          raise exception 'Thieu moc thoi gian nop bao cao.';
        end if;
      else
        raise exception 'Luong trang thai bao cao khong hop le.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_no_intern_edit on public.periodic_reports;
create trigger reports_no_intern_edit
before update on public.periodic_reports
for each row execute function public.prevent_intern_report_edit();

-- ============================================================
-- 7) leave_requests
-- ============================================================
alter table public.leave_requests enable row level security;
revoke all on public.leave_requests from anon;
grant select, insert, update on public.leave_requests to authenticated;

drop policy if exists leave_requests_select on public.leave_requests;
create policy leave_requests_select on public.leave_requests
for select to authenticated
using (
  public.is_admin()
  or intern_id = auth.uid()
  or mentor_id = auth.uid()
  or public.is_mentor_of(intern_id)
);

drop policy if exists leave_requests_insert on public.leave_requests;
create policy leave_requests_insert on public.leave_requests
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.current_user_role() = 'intern'::public.user_role
    and intern_id = auth.uid()
    and mentor_id = public.get_my_mentor_id()
  )
  or (
    public.current_user_role() = 'mentor'::public.user_role
    and (mentor_id = auth.uid() and public.is_mentor_of(intern_id))
  )
);

drop policy if exists leave_requests_update on public.leave_requests;
create policy leave_requests_update on public.leave_requests
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id))
);

drop policy if exists leave_requests_delete_admin on public.leave_requests;
create policy leave_requests_delete_admin on public.leave_requests
for delete to authenticated
using (public.is_admin());

-- ============================================================
-- 8) attendance
-- ============================================================
alter table public.attendance enable row level security;
revoke all on public.attendance from anon;
grant select, insert, update on public.attendance to authenticated;

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
for insert to authenticated
with check (
  public.is_admin()
  or (public.current_user_role() = 'intern'::public.user_role and intern_id = auth.uid())
);

drop policy if exists attendance_update_self on public.attendance;
create policy attendance_update_self on public.attendance
for update to authenticated
using (public.is_admin() or (public.current_user_role() = 'intern'::public.user_role and intern_id = auth.uid()))
with check (public.is_admin() or (public.current_user_role() = 'intern'::public.user_role and intern_id = auth.uid()));

drop policy if exists attendance_delete_admin on public.attendance;
create policy attendance_delete_admin on public.attendance
for delete to authenticated
using (public.is_admin());

-- ============================================================
-- 9) evaluations (đánh giá giữa kỳ)
-- ============================================================
alter table public.evaluations enable row level security;
revoke all on public.evaluations from anon;
grant select, insert, update on public.evaluations to authenticated;

drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations
for select to authenticated
using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));

drop policy if exists evaluations_write_mentor on public.evaluations;
create policy evaluations_write_mentor on public.evaluations
for insert to authenticated
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
);
drop policy if exists evaluations_update_mentor on public.evaluations;
create policy evaluations_update_mentor on public.evaluations
for update to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'mentor'::public.user_role and mentor_id = auth.uid() and public.is_mentor_of(intern_id))
);

drop policy if exists evaluations_delete_admin on public.evaluations;
create policy evaluations_delete_admin on public.evaluations
for delete to authenticated
using (public.is_admin());

-- ============================================================
-- 10) final_evaluations (đã có ở migration 2 - giữ lại, đảm bảo idempotent)
-- ============================================================
alter table public.final_evaluations enable row level security;
revoke all on public.final_evaluations from anon;
grant select, insert, update on public.final_evaluations to authenticated;

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

-- ============================================================
-- 11) Fallback: bảng weekly_reports cũ nếu còn tồn tại (DB chưa chạy migration 2)
-- ============================================================
do $$
begin
  if to_regclass('public.weekly_reports') is not null then
    alter table public.weekly_reports enable row level security;
    drop policy if exists weekly_reports_select on public.weekly_reports;
    create policy weekly_reports_select on public.weekly_reports
      for select to authenticated
      using (public.is_admin() or intern_id = auth.uid() or public.is_mentor_of(intern_id));
    drop policy if exists weekly_reports_insert on public.weekly_reports;
    create policy weekly_reports_insert on public.weekly_reports
      for insert to authenticated
      with check (public.is_admin() or (intern_id = auth.uid() and public.current_user_role() = 'intern'::public.user_role));
    drop policy if exists weekly_reports_update_mentor on public.weekly_reports;
    create policy weekly_reports_update_mentor on public.weekly_reports
      for update to authenticated
      using (public.is_admin() or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id)))
      with check (public.is_admin() or (public.current_user_role() = 'mentor'::public.user_role and public.is_mentor_of(intern_id)));
    drop policy if exists weekly_reports_delete_admin on public.weekly_reports;
    create policy weekly_reports_delete_admin on public.weekly_reports
      for delete to authenticated
      using (public.is_admin());
  end if;
end $$;

-- ============================================================
-- 12) Realtime: đăng ký đủ các bảng cần push feed (idempotent)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leave_requests'
  ) then
    alter publication supabase_realtime add table public.leave_requests;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'periodic_reports'
  ) then
    alter publication supabase_realtime add table public.periodic_reports;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendance'
  ) then
    alter publication supabase_realtime add table public.attendance;
  end if;
end $$;

-- ============================================================
-- 13) Lưu ý: Storage (bucket file đính kèm)
--     Tọa bucket 'attachments' (public) rồi:
--       create policy "attachments_read" on storage.objects for select ... using (bucket_id = 'attachments');
--       create policy "attachments_write" on storage.objects for insert/update ... 
--         with check (bucket_id = 'attachments' and (select role from public.profiles where id = auth.uid()) in ('intern','mentor','admin'));
-- ============================================================