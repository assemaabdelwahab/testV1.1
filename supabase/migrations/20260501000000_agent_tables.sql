-- Apply via Supabase dashboard SQL editor

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  goal_text text not null,
  target_amount numeric not null,
  target_currency text not null default 'EGP',
  month date not null,
  agent_plan jsonb,
  status text not null default 'active'
);

create table agent_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  goal_id uuid references savings_goals(id),
  role text not null,
  content text not null
);
