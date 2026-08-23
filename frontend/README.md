# Frontend Boundary

The Next.js frontend currently lives at the repository root (`app/`, `components/`,
`features/`, `hooks/`, `lib/`, `package.json`). It was not moved into this
folder to avoid a high-risk path/import migration.

Use the root `package.json` for frontend commands:

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
```

Frontend/backend separation is enforced through `NEXT_PUBLIC_API_URL`.

