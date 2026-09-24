create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  professional_title text,
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'freelancer', 'admin')),
  roles text[] not null default array['client']::text[],
  availability boolean not null default true,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.freelancer_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  id_document_url text,
  selfie_url text,
  portfolio_files text[] not null default array[]::text[],
  certificates text[] not null default array[]::text[],
  external_links text[] not null default array[]::text[],
  skill_tags text[] not null default array[]::text[],
  pitch_statement text,
  admin_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  title text not null,
  slug text not null unique,
  description text not null,
  budget_min numeric(10,2) not null default 0,
  budget_max numeric(10,2) not null default 0,
  deadline timestamptz,
  status text not null default 'open' check (status in ('draft', 'open', 'awarded', 'closed', 'cancelled')),
  reference_files text[] not null default array[]::text[],
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  proposed_price numeric(10,2) not null,
  delivery_days integer not null check (delivery_days > 0),
  cover_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, freelancer_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references public.gigs(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'delivered', 'revision_requested', 'completed', 'disputed', 'cancelled')),
  amount numeric(10,2) not null,
  title text not null,
  description text not null,
  deliverables text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  attachments text[] not null default array[]::text[],
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_gigs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, gig_id)
);

create table if not exists public.verification_audit_logs (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.freelancer_verifications(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('submitted', 'under_review', 'approved', 'rejected', 'more_info_requested')),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, roles)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    array[coalesce(new.raw_user_meta_data ->> 'role', 'client')]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.freelancer_verifications enable row level security;
alter table public.gigs enable row level security;
alter table public.bids enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_gigs enable row level security;
alter table public.verification_audit_logs enable row level security;

create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Public categories are viewable by all authenticated users"
on public.categories
for select
using (auth.role() = 'authenticated');

create policy "Admins manage categories"
on public.categories
for all
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Users can read their own verification"
on public.freelancer_verifications
for select
using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Users can create their own verification"
on public.freelancer_verifications
for insert
with check (auth.uid() = user_id);

create policy "Admins can review verification records"
on public.freelancer_verifications
for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Users can view gigs they can access"
on public.gigs
for select
using (auth.role() = 'authenticated');

create policy "Clients can create their own gigs"
on public.gigs
for insert
with check (
  auth.uid() = client_id
);

create policy "Clients can update their own gigs"
on public.gigs
for update
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

create policy "Users can view bids related to their gigs or their own bids"
on public.bids
for select
using (
  auth.uid() = freelancer_id or exists (
    select 1 from public.gigs g where g.id = gig_id and g.client_id = auth.uid()
  )
);

create policy "Freelancers can create bids for open gigs"
on public.bids
for insert
with check (
  auth.uid() = freelancer_id
);

create policy "Users can update their own bid or their own gig bids"
on public.bids
for update
using (
  auth.uid() = freelancer_id or exists (
    select 1 from public.gigs g where g.id = gig_id and g.client_id = auth.uid()
  )
)
with check (
  auth.uid() = freelancer_id or exists (
    select 1 from public.gigs g where g.id = gig_id and g.client_id = auth.uid()
  )
);

create policy "Users can view orders they are in"
on public.orders
for select
using (
  auth.uid() = client_id or auth.uid() = freelancer_id
);

create policy "Clients can create orders through accepted bids"
on public.orders
for insert
with check (auth.uid() = client_id);

create policy "Order participants can update their orders"
on public.orders
for update
using (
  auth.uid() = client_id or auth.uid() = freelancer_id
)
with check (
  auth.uid() = client_id or auth.uid() = freelancer_id
);

create policy "Users can view order events for their orders"
on public.order_events
for select
using (
  exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Any order participant can add an event"
on public.order_events
for insert
with check (
  exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Users can view messages for their orders"
on public.messages
for select
using (
  exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Order participants can send messages"
on public.messages
for insert
with check (
  exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Users can update only their own read state"
on public.messages
for update
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

create policy "Users can view all reviews for their profile or their orders"
on public.reviews
for select
using (
  auth.uid() = reviewer_id or auth.uid() = reviewee_id or exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Participants can submit reviews on their orders"
on public.reviews
for insert
with check (
  exists (
    select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
  )
);

create policy "Users can view their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own saved gigs"
on public.saved_gigs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins can read verification audit logs"
on public.verification_audit_logs
for select
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Admins can insert verification audit logs"
on public.verification_audit_logs
for insert
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));
