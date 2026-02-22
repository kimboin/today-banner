# Repository Guidelines

## Project Structure & Module Organization
- `public/`: static frontend files served by Vercel (`index.html`, `style.css`, `app.js`).
- `api/`: serverless API handlers.
  - `api/state.js`: read today's banner state.
  - `api/claim.js`: first-come daily claim endpoint.
  - `api/_lib/`: shared helpers (`db.js`, `time.js`, `http.js`).
- `supabase/schema.sql`: Postgres schema for production/local DB setup.
- `vercel.json`: routing for static assets and `/api/*` functions.

Keep route logic in `api/*.js` and shared behavior in `api/_lib/*`. Do not add browser-only code into API handlers.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: run local Vercel dev server.
- `npm start`: alias of `npm run dev`.

Typical local flow:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run dev
```

## Coding Style & Naming Conventions
- JavaScript with CommonJS (`require`/`module.exports`).
- 2-space indentation, semicolons, and single-responsibility helper functions.
- Naming: `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- Keep API responses explicit and consistent (`status code + JSON { message/state }`).

## Testing Guidelines
- No automated test suite is configured yet.
- Validate manually before PR:
  1. `GET /api/state` returns empty state on new day.
  2. First `POST /api/claim` succeeds.
  3. Second same-day `POST /api/claim` returns `409`.
  4. 40-char limit and empty input validation return `400`.

If tests are added, place them under `tests/` and add scripts in `package.json`.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages (e.g., `Add Supabase claim conflict handling`).
- Keep commits focused on one logical change.
- PRs should include:
  - Change summary and rationale.
  - Verification steps (commands/endpoints tested).
  - UI screenshots for `public/` updates.
  - Any required env vars or schema changes.

## Security & Configuration Tips
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.
- Validate all user input in API handlers before DB writes.
- Treat `RESET_TIMEZONE` as a server-side setting; default is `Asia/Seoul`.
