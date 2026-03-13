# v-boost

Vue frontend + Express backend in a single deployable service.

## Run locally

1. Install dependencies:
	- `npm install`
2. Create your local env file from `.env.example` and fill in real values.
3. Required variables:
	- `ZEFAME_API_KEY`
	- `DATABASE_URL`
4. Optional variables:
	- `DATABASE_SSL=false` for non-SSL local DB
	- `ALLOWED_ORIGIN=http://127.0.0.1:5173`
	- `VITE_API_PROXY_TARGET=http://127.0.0.1:3001`
5. Start frontend + backend:
	- `npm run dev:all`

## Production / Railway

This app is already set up for one Railway web service using [Dockerfile](Dockerfile).

Required Railway variables:
- `ZEFAME_API_KEY`
- `DATABASE_URL`

Optional Railway variables:
- `ALLOWED_ORIGIN=https://your-app.up.railway.app`
- `DATABASE_SSL=true`

Notes:
- Backend entrypoint is `node server/server.js`.
- Express serves the built frontend from `dist`.
- Frontend calls `/api/*` with relative paths, so same-domain routing works in Railway.
- `docker-compose.yml` now requires explicit credentials via environment variables and no longer hardcodes database secrets.
