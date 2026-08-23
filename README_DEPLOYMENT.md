# DARFUS Jewellery ERP Deployment

This project is kept in its current structure:

- Frontend (Next.js): repository root (`app/`, `components/`, `features/`, `package.json`)
- Backend (Express/Sequelize): `backend/`
- PostgreSQL: external, local, or Docker service
- Redis: optional, used by queue/realtime-adjacent services when configured

The frontend talks to the backend only through `NEXT_PUBLIC_API_URL`.

## Local Development

1. PostgreSQL

Create a database:

```bash
createdb darfus_erp
```

2. Backend env

Copy `backend/.env.example` to `backend/.env` and set:

```env
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darfus_erp
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=long_random_secret
JWT_REFRESH_SECRET=another_long_random_secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin
```

3. Frontend env

Copy `.env.local.example` to `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. Install and run

```bash
npm install
cd backend && npm install && npm run db:migrate
cd ..
npm run dev
cd backend && npm run dev
```

Frontend: <http://localhost:3000>  
Backend: <http://localhost:8000/api/v1/health>

## Docker

The backend image is defined in `backend/Dockerfile`.

```bash
docker compose up --build
```

The compose file starts PostgreSQL, Redis, and the backend. Use environment
variables or a compose override for production secrets. Do not use the dev
values in production.

By default Docker publishes PostgreSQL on host port `5433` to avoid colliding
with an installed local PostgreSQL on `5432`. The backend still connects to
`postgres:5432` inside the Docker network. Override with `POSTGRES_PORT=5432`
only if your host port is free.

## Production / VPS

Recommended domains:

- Frontend: `https://erp.example.com`
- Backend: `https://api.example.com`

Backend production env must include:

```env
NODE_ENV=production
PORT=8000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=darfus_erp
DB_USER=darfus_app
DB_PASS=strong_db_password
DB_SSL=true
JWT_SECRET=long_random_secret_32_chars_min
JWT_REFRESH_SECRET=another_long_random_secret_32_chars_min
CORS_ALLOWED_ORIGINS=https://erp.example.com
FRONTEND_URL=https://erp.example.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong_first_admin_password
ADMIN_FIRST_NAME=Primary
ADMIN_LAST_NAME=Admin
```

Frontend production env:

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

Run migrations before starting a new release:

```bash
cd backend
npm run db:migrate
npm start
```

## First Admin

On startup, the backend checks if an admin/owner exists.

- If one exists: nothing is changed.
- If none exists: it creates one from `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
  `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, and optional `ADMIN_PHONE`.
- In production, missing admin env values stop startup with a clear error.

Admin credentials are never hardcoded. They come only from env.

## Users and Permissions

Admins manage users at:

```text
/settings/users
```

From there an admin can:

- create users
- assign roles
- edit role permissions

Backend permission checks use `requirePermission("module.action")` and admin /
owner bypass all checks.

## Notifications

Notifications are exposed through:

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `DELETE /notifications/:id`

Realtime delivery uses Server-Sent Events at `/events/stream`.

To test:

1. Open the dashboard.
2. Create a sale or user.
3. Watch the bell badge and toast notification.

## Settings

Company settings are exposed through:

- `GET /settings`
- `PATCH /settings`
- `GET /settings/by-key/:key`
- `PUT /settings/by-key/:key`

Important settings currently wired into the UI include company name, logo,
currency, and receipt/print customization.

## Health Checks

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `GET /api/v1/health/redis`
