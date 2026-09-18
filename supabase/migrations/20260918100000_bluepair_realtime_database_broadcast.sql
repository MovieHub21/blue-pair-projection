create or replace function public.broadcast_bluepair_database_change()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'at', now()
    ),
    'db_change',
    'bluepair:database',
    false
  );
  return coalesce(NEW, OLD);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_roles','profiles','room_types','rooms','customers','bookings','staff',
    'menu_items','drinks','short_lets','events','maintenance_tickets',
    'housekeeping_tasks','billboards','parking_zones','payments','offers',
    'guest_requests','gallery_images','amenities','role_permissions','site_content',
    'email_logs','activity_logs','blog_posts','event_reservations',
    'contact_conversations','contact_messages','guest_reviews','guest_notifications',
    'financial_transactions','financial_expenses','site_settings','room_service_orders',
    'payment_holds','room_daily_statuses'
  ]
  loop
    execute format('drop trigger if exists bluepair_realtime_change on public.%I', table_name);
    execute format(
      'create trigger bluepair_realtime_change after insert or update or delete on public.%I for each row execute function public.broadcast_bluepair_database_change()',
      table_name
    );
  end loop;
end;
$$;
