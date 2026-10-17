# Continuity - Healthcare Continuity Platform (frontend)

Frontend for a platform where patients keep one unified medical history across hospitals and
clinics, and doctors view it only with the patient's time-limited, consent-based access.

Built with Next.js (App Router), TypeScript strict mode, Tailwind CSS v4, TanStack Query,
react-hook-form + zod, Radix UI primitives (dialog only), react-icons (Lucide set), date-fns,
qrcode.react and html5-qrcode. Fonts: IBM Plex Sans and IBM Plex Mono via next/font.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app starts in mock mode with seeded data, so every screen works
without the backend.

## Mock/real switch (single switch, no other code changes)

In `.env.local`:

```
NEXT_PUBLIC_USE_MOCKS=true   # in-memory mock adapter (default)
NEXT_PUBLIC_USE_MOCKS=false  # real backend via the /api/* rewrite
BACKEND_ORIGIN=http://localhost:8000
```

With `NEXT_PUBLIC_USE_MOCKS=false` the browser calls `/api/*` on its own origin and Next.js
proxies to the FastAPI backend (no CORS). The switch itself lives in `lib/api/config.ts`; the
mock adapter is `lib/api/mock/`.

The backend is expected to implement exactly the endpoints listed in `lib/api/endpoints.ts`
(`ApiClient` interface), returning errors as `{ error: { code, message } }` with 401/403/422.
Doctor patient routes receive the consent token in the `X-Consent-Token` header.

## Demo accounts (mock mode)

| Role    | Email                        | Password    |
| ------- | ---------------------------- | ----------- |
| Patient | ananya.sharma@example.com    | Patient@123 |
| Patient | rohan.mehta@example.com      | Patient@123 |
| Doctor  | kavita.rao@example.com       | Doctor@123  |
| Doctor  | arjun.nair@example.com       | Doctor@123  |
| Doctor  | meera.iyer@example.com       | Doctor@123  |

Seeded data: 2 patients, 3 doctors, 18 records across Apollo Hospitals, Fortis Hospital and
Manipal Hospital over 2025-2026, current and past medications, share tokens in active/expired/
revoked states, and access log rows including a denied attempt.

Notes on mock mode:

- The mock database persists to localStorage, so share tokens, records and the access log
  survive reloads and are shared across tabs of the same browser. It reseeds after 12 hours
  or if the store is cleared. Seeded demo windows expire like real ones; generate a fresh
  access code when the recent-patients list is empty.
- To demo the consent flow across two tabs: generate an access code as the patient in one tab,
  log in as the doctor in another tab of the same browser, and paste the link on Find patient.
  A different browser or phone cannot see mock data, so scanned QR codes only work in the same
  browser.
- Seeded record files download as small placeholder documents; files uploaded in mock mode are
  returned as uploaded (until reload, after which the placeholder is served).

## Screens

- `/login`, `/register` - auth with patient/doctor role choice and role-specific fields
- `/patient/timeline` - records grouped by year/month, category tabs with counts, search,
  hospital and date filters, detail drawer, current medications panel
- `/patient/upload` - file drop zone, extraction with confidence warnings, review form,
  manual entry fallback
- `/patient/share` - time-limited access code with QR, link, countdown, revoke, token table
- `/patient/access-log` - doctor access log with allowed/denied filters and pagination
- `/patient/emergency` - printable emergency card (print styles hide the app shell)
- `/patient/profile` - editable profile
- `/doctor/find` - open shared record via QR scan or pasted link, recent patients table
- `/doctor/access?token=...` - share-link landing; redirects through login when signed out
- `/doctor/patient/[patientId]` - read-only timeline, medications panel, Add visit form,
  access countdown with automatic end-of-window handling (403 -> modal -> Find patient)

## Route protection

`proxy.ts` (Next.js 16 proxy, formerly middleware) checks the `hc_session` cookie and, when the
role is readable, redirects wrong-role and signed-out visits. The client guard in
`components/layout/app-shell.tsx` re-checks via `GET /api/auth/me`, and the API client handles
401/403 centrally (redirect to login with a `next` parameter).

## Scripts

- `npm run dev` - development server (Turbopack)
- `npm run build` - production build
- `npm run lint` - ESLint
