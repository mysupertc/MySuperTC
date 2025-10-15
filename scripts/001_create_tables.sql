-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  type text check (type in ('buyer', 'seller', 'both')),
  status text check (status in ('active', 'inactive', 'archived')) default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  address text not null,
  type text check (type in ('listing', 'purchase', 'lease')) not null,
  status text check (status in ('prospecting', 'pre-listing', 'listed', 'under-contract', 'closed', 'cancelled')) default 'prospecting',
  price decimal(12, 2),
  commission decimal(12, 2),
  close_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id uuid references public.transactions(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create checklist_items table
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  category text,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create calendar_events table
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.clients enable row level security;
alter table public.transactions enable row level security;
alter table public.tasks enable row level security;
alter table public.checklist_items enable row level security;
alter table public.calendar_events enable row level security;

-- RLS Policies for clients
create policy "Users can view their own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- RLS Policies for transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- RLS Policies for tasks
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- RLS Policies for checklist_items
create policy "Users can view their own checklist items"
  on public.checklist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checklist items"
  on public.checklist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own checklist items"
  on public.checklist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own checklist items"
  on public.checklist_items for delete
  using (auth.uid() = user_id);

-- RLS Policies for calendar_events
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_transaction_id_idx on public.tasks(transaction_id);
create index if not exists checklist_items_transaction_id_idx on public.checklist_items(transaction_id);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_start_time_idx on public.calendar_events(start_time);
