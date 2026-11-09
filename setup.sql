-- Supabase SQL Editor에서 실행. 실행 전 관리자 계정을 Authentication > Users에서 생성하세요.
create table if not exists public.site_admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.site_content (id integer primary key check(id=1), content jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.site_admins enable row level security;
alter table public.site_content enable row level security;
revoke all on public.site_admins from anon,authenticated;
revoke all on public.site_content from anon,authenticated;
grant select on public.site_admins to authenticated;
grant select on public.site_content to anon,authenticated;
grant insert,update on public.site_content to authenticated;
create policy "admin can read self" on public.site_admins for select to authenticated using (user_id=(select auth.uid()));
create policy "public can read content" on public.site_content for select to anon,authenticated using (true);
create policy "admin can insert content" on public.site_content for insert to authenticated with check (exists(select 1 from public.site_admins a where a.user_id=(select auth.uid())));
create policy "admin can update content" on public.site_content for update to authenticated using (exists(select 1 from public.site_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.site_admins a where a.user_id=(select auth.uid())));
insert into public.site_content(id,content) values(1,'{}'::jsonb) on conflict(id) do nothing;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('site-images','site-images',true,8388608,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy "only admin uploads images" on storage.objects for insert to authenticated with check (bucket_id='site-images' and exists(select 1 from public.site_admins a where a.user_id=(select auth.uid())));
-- 관리자 계정 생성 후 아래의 이메일을 실제 관리자 이메일로 변경하고 실행하세요.
-- insert into public.site_admins(user_id) select id from auth.users where email='YOUR_ADMIN_EMAIL@example.com' on conflict do nothing;
