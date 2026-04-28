create table if not exists public.tiktok_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  caption text,
  posted_at timestamptz not null default now(),
  posted_by uuid,
  notes text,
  unique(property_id)
);

alter table public.tiktok_posts enable row level security;

create policy "Admins can manage tiktok_posts"
  on public.tiktok_posts for all
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Service role full access on tiktok_posts"
  on public.tiktok_posts for all
  using (auth.role() = 'service_role');

create index if not exists tiktok_posts_property_id_idx on public.tiktok_posts(property_id);
create index if not exists tiktok_posts_posted_at_idx on public.tiktok_posts(posted_at desc);