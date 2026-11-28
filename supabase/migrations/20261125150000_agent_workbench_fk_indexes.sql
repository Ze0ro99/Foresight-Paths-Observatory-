-- Cover the two foreign keys identified by the Supabase performance advisor.
create index if not exists agent_proposals_agent_id_idx
  on public.agent_proposals (agent_id);

create index if not exists user_agents_template_key_idx
  on public.user_agents (template_key);
