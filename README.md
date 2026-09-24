# Freelance Service Marketplace

This workspace contains a staged scaffold for a full-stack freelance marketplace built with:

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript + Supabase
- Database/Auth/Storage: Supabase PostgreSQL + RLS + Auth + Storage

## Repository structure

- `frontend/` — Vite React app
- `backend/` — Express API server and Supabase integration
- `backend/db/schema.sql` — full Supabase SQL schema with RLS policies

## Quick start

### 1) Create a Supabase project

1. Create a new project in Supabase.
2. Copy your project URL and anon/service role keys.
3. Run the SQL in `backend/db/schema.sql` in the Supabase SQL editor.
4. Create storage buckets for `avatars`, `portfolio`, `verification-docs`, and `order-deliverables` if you want upload support from day one.

### 2) Configure backend environment

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Then fill in:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`
- `CORS_ORIGIN`

Create `frontend/.env` from `frontend/.env.example` when the API is not running on the default port:

```bash
cp frontend/.env.example frontend/.env
```

The Supabase URL and keys must come from your own Supabase project. They are intentionally not generated or committed by this repository.

### 3) Install backend dependencies

```bash
cd backend
npm install
```

### 4) Run backend locally

```bash
npm run dev
```

### 5) Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

## Supabase auth flow

- Frontend signs up or logs in through Supabase Auth.
- Express validates the JWT using `@supabase/supabase-js` on protected routes.
- App-level role checks are enforced in middleware using `profiles.role` and `profiles.roles`.

## Current scaffold status

This scaffold includes:

- full SQL schema with RLS policies for the marketplace entities
- backend Express boilerplate and Supabase client integration
- auth middleware to validate Supabase JWTs
- a starter frontend app shell

The next phase is to implement:

1. real auth pages and role-aware routing
2. profile and freelancer verification wizard
3. gig posting and bidding flows
4. order workflow, chat, reviews, and admin dashboards

## Important constraints

- No fake or seed data is added by default.
- All platform data starts empty until real users complete workflows.
- Do not expose service-role keys in the frontend or check them into source control.
