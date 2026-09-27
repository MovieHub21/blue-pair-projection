-- Short-lets get a proper photo gallery (like room types already have), instead of one photo each.
alter table public.short_lets add column if not exists images text[] not null default '{}';
update public.short_lets set images = array[image] where images = '{}' and image is not null and image <> '';
