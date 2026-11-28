create policy "service_role_manage_cisa_kev_items"
  on public.cisa_kev_items
  for all
  to service_role
  using (true)
  with check (true);
