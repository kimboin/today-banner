# Today Banner (Serverless)

One person can claim the banner each day. After midnight (by configured timezone), a new claim is available.

## Stack
- Frontend + API: Vercel
- Database: Supabase Postgres
- Repository/CI: GitHub

## Project Structure
- `public/`: static frontend (`index.html`, `style.css`, `app.js`)
- `api/`: Vercel serverless API routes
  - `api/state.js`
  - `api/claim.js`
- `api/_lib/`: shared helpers (DB, time, HTTP)
- `supabase/schema.sql`: DB schema
- `vercel.json`: routing config

## Environment Variables
Set these in Vercel Project Settings (and locally for `vercel dev`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_SECRET_KEY`
- `RESET_TIMEZONE` (default: `Asia/Seoul`)

## Supabase Setup
Run SQL from `supabase/schema.sql`:

```sql
create table if not exists public.daily_banner_claims (
  date_key text primary key,
  text varchar(40) not null,
  claimed_at timestamptz not null default now()
);
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4000`.

If you want to run Vercel's local runtime instead, use:

```bash
npm run dev:vercel
```

## API Summary
- `GET /api/state`: returns today's banner state
- `POST /api/claim`: claim today's banner (`{ "text": "..." }`)

## Deployment
1. Push to GitHub.
2. Import repo in Vercel.
3. Configure environment variables.
4. Deploy.
