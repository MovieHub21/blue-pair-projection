-- Fix the guest review policy to match the real booking relationship.
-- Guest bookings are linked through bookings.customer_id, not bookings.user_id.
-- A review is allowed after a recorded check-in; checked-in/checked-out status
-- is also accepted for older records that predate checked_in_at.

drop policy if exists "Eligible guests can submit reviews" on public.guest_reviews;

create policy "Eligible guests can submit reviews"
  on public.guest_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.bookings b
      join public.customers c on c.id = b.customer_id
      where b.id = booking_id
        and c.user_id = auth.uid()
        and (
          b.checked_in_at is not null
          or b.status in ('checked_in', 'checked_out')
        )
    )
  );
