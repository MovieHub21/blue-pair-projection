create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  content text not null,
  image_url text not null,
  category text not null default 'Hotel News',
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (published, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category);

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (published = true);

drop policy if exists "Staff can manage blog posts" on public.blog_posts;
create policy "Staff can manage blog posts"
  on public.blog_posts for all
  using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid()))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid()));

insert into public.blog_posts (title, slug, description, content, image_url, category, published, published_at)
values
('A New Way to Experience Uromi', 'a-new-way-to-experience-uromi', 'Discover the comfort, dining, leisure and warm hospitality that make Blue Pair Hotel a memorable stay in Uromi.', 'Blue Pair Hotel brings together comfortable rooms, thoughtful hospitality and spaces designed for both quiet stays and lively moments. Whether you are visiting Uromi for business, family, an event or simply a change of pace, our goal is to make every part of your stay feel easy and welcoming.\n\nFrom our rooms and indoor pool to dining, the VIP lounge, gym and entertainment spaces, there is always somewhere to relax between plans. We are proud to be part of Uromi and to offer guests a convenient base for discovering Edo State.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85', 'Hotel News', true, now() - interval '1 day'),
('Slow Mornings, Better Stays', 'slow-mornings-better-stays', 'A look at the little details that help guests start their day feeling rested, refreshed and ready.', 'A good hotel morning does not need to be complicated. A comfortable room, a calm atmosphere, a good meal and a little time to yourself can change the rhythm of an entire day.\n\nAt Blue Pair Hotel, we are building spaces around that idea: rest when you need it, breakfast and dining when you are ready, and leisure options close by when the day begins. It is the simple combination of comfort and convenience that makes a stay feel special.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=85', 'Stay & Comfort', true, now() - interval '3 days'),
('Weekend Dining at Blue Pair', 'weekend-dining-at-blue-pair', 'Make your next weekend about good food, good company and an easy atmosphere close to home.', 'Weekends are made for gathering. Blue Pair Hotel offers dining spaces for relaxed meals, conversations and celebrations, with options across the main hotel and The Annex.\n\nPlanning a casual meal, a family gathering or a special occasion? Our restaurant, bars, outdoor eatery and grilling spaces give you room to choose the atmosphere that fits the moment. Check our dining and events pages for the latest offerings and ways to plan your visit.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=85', 'Dining', true, now() - interval '5 days'),
('Planning an Event in Uromi?', 'planning-an-event-in-uromi', 'From private celebrations to professional gatherings, discover spaces that can help bring your next event together.', 'The right venue makes an event easier to plan. Blue Pair Hotel offers a range of spaces and services for celebrations, meetings, entertainment and social gatherings in Uromi.\n\nStart with the size and atmosphere you need, then let our team help with the practical details. Our events, dining, lounge and entertainment facilities can be combined to create an experience that feels polished without feeling distant or formal.', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=85', 'Events', true, now() - interval '7 days'),
('Why Guests Choose a Hotel With More to Explore', 'why-guests-choose-a-hotel-with-more-to-explore', 'A stay becomes more convenient when relaxation, fitness, entertainment and dining are all within reach.', 'A hotel can be more than a room for the night. For many travellers, having useful amenities close at hand makes a real difference to the way a stay feels.\n\nAt Blue Pair Hotel, guests can move from rest to recreation without leaving the property. Spend time at the indoor pool, keep up with your fitness routine, unwind in the VIP lounge, enjoy games or explore our club and dining spaces. The idea is simple: give guests more ways to enjoy their time in Uromi.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85', 'Experience', true, now() - interval '9 days')
on conflict (slug) do nothing;

create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_posts_updated_at();
