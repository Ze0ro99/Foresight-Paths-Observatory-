create policy url_inspection_rate_limits_service_role_guard
  on private.url_inspection_rate_limits for all to service_role
  using (true) with check (true);