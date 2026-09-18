create table if not exists public.developer_feature_controls (environment text not null check (environment in ('development','preview','production')), feature text not null, enabled boolean not null default true, updated_at timestamptz not null default now(), primary key (environment, feature));
alter table public.developer_feature_controls enable row level security;
insert into public.developer_feature_controls (environment, feature, enabled) values
('development','all_apis',true),('preview','all_apis',true),('production','all_apis',true),
('development','payments',true),('preview','payments',true),('production','payments',true),
('development','bookings',true),('preview','bookings',true),('production','bookings',true),
('development','availability',true),('preview','availability',true),('production','availability',true),
('development','auth',true),('preview','auth',true),('production','auth',true),
('development','reviews',true),('preview','reviews',true),('production','reviews',true),
('development','restaurant',true),('preview','restaurant',true),('production','restaurant',true),
('development','bar',true),('preview','bar',true),('production','bar',true),
('development','shortlets',true),('preview','shortlets',true),('production','shortlets',true),
('development','events',true),('preview','events',true),('production','events',true),
('development','ai',true),('preview','ai',true),('production','ai',true),
('development','emails',true),('preview','emails',true),('production','emails',true)
on conflict (environment, feature) do nothing;