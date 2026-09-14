alter table public.rooms
add column if not exists images text[] not null default '{}';

update public.rooms
set images = array[image_url]
where image_url is not null
  and trim(image_url) <> ''
  and coalesce(array_length(images, 1), 0) = 0;
