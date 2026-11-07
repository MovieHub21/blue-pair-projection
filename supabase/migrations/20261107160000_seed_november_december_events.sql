insert into public.events (id, title, date, price, capacity, image, description, published)
select 'e_anniversary_20261115', 'Blue Pair Anniversary Celebration', '2026-11-15', 0, 100,
  'https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=900&q=80',
  'Join us on 15 November for the Blue Pair anniversary celebration. Venue and event details to be announced.', true
where not exists (select 1 from public.events where title = 'Blue Pair Anniversary Celebration' and date = '2026-11-15');

insert into public.events (id, title, date, price, capacity, image, description, published)
select 'e_couple_dinner_20261129', 'Couple Dinner Night', '2026-11-29', 0, 100,
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
  'A special dinner night for couples at the Hall on 29 November. Menu and event details to be announced.', true
where not exists (select 1 from public.events where title = 'Couple Dinner Night' and date = '2026-11-29');

insert into public.club_events (title, date, price, description, published)
select 'Halloween and Mask Night', '2026-12-13', 0,
  'A Halloween and mask night at the Club on 13 December. Event details to be announced.', true
where not exists (select 1 from public.club_events where title = 'Halloween and Mask Night' and date = '2026-12-13');
