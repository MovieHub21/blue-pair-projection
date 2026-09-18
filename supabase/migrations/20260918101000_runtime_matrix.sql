do $$
begin
  if to_regclass('public.developer_feature_controls') is not null
     and to_regclass('public.runtime_matrix') is null then
    alter table public.developer_feature_controls rename to runtime_matrix;
    alter table public.runtime_matrix rename column environment to scope;
    alter table public.runtime_matrix rename column feature to item;
    alter table public.runtime_matrix rename column enabled to active;
  end if;
end
$$;

create table if not exists public.runtime_matrix (
  scope text not null check (scope in ('development','preview','production')),
  item text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (scope, item)
);

alter table public.runtime_matrix enable row level security;

insert into public.runtime_matrix (scope, item, active) values
('development','global',true),('preview','global',true),('production','global',true),
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
on conflict (scope, item) do nothing;
