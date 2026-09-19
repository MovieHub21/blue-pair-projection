-- Promote any existing daily Available Soon rows to the permanent room state.
update public.rooms r
set status = 'available_soon'
from public.room_daily_statuses d
where d.room_id = r.id
  and d.status = 'available_soon'
  and r.status <> 'maintenance';

delete from public.room_daily_statuses
where status = 'available_soon';
