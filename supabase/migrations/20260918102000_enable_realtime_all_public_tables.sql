-- Enable Supabase Postgres Realtime for every public application table.
-- The client listens for database changes and refetches authoritative data.
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> 'spatial_ref_sys'
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', r.tablename);
    exception
      when duplicate_object then null;
    end;
  end loop;
end
$$;
