-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('owner', 'employee')),
  telegram_chat_id text,
  created_at timestamp with time zone default now()
);

-- Customers table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  address text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade,
  employee_id uuid references public.profiles(id),
  amount_owed numeric(10, 2) not null,
  currency text not null default 'KHR' check (currency in ('KHR', 'USD')),
  payment_method text not null check (payment_method in ('cash', 'aba_khqr')),
  is_paid boolean default false,
  paid_at timestamp with time zone,
  note text,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;

-- Profiles: users can read their own, owner can read all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Owner can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

-- Customers: employee sees their own, owner sees all
create policy "Employee sees own customers" on public.customers
  for select using (created_by = auth.uid());

create policy "Owner sees all customers" on public.customers
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Employee can insert customers" on public.customers
  for insert with check (created_by = auth.uid());

-- Orders: employee sees own, owner sees all
create policy "Employee sees own orders" on public.orders
  for select using (employee_id = auth.uid());

create policy "Owner sees all orders" on public.orders
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "Employee can insert orders" on public.orders
  for insert with check (employee_id = auth.uid());

create policy "Employee can mark paid" on public.orders
  for update using (employee_id = auth.uid());
