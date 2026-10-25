# Skybreak Infra Pvt Ltd — Website & Admin Dashboard

> **ELEVATING EXCELLENCE**

A full-stack website for **Skybreak Infra Pvt Ltd**, a residential and commercial construction and real estate development company. It includes a premium public website with an interactive 3D architectural model, project and service pages backed by PostgreSQL, a secure contact enquiry workflow, and a protected admin dashboard for managing projects, services, enquiries and company details.

> ⚠️ **Before launch:** the database seed contains **illustrative sample projects** (clearly labelled "Illustrative sample") and **no company contact details**. Replace the samples with real projects and enter verified contact details in **Admin → Settings**. See [Going live checklist](#going-live-checklist).

---

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start (Windows PowerShell)](#quick-start-windows-powershell)
- [Environment configuration](#environment-configuration)
- [Database setup and migrations](#database-setup-and-migrations)
- [Seed / demo data](#seed--demo-data)
- [Creating the first admin](#creating-the-first-admin)
- [Running locally](#running-locally)
- [Running tests](#running-tests)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Email notifications](#email-notifications)
- [Image storage](#image-storage)
- [Brand assets and logo](#brand-assets-and-logo)
- [Replacing demo projects and imagery](#replacing-demo-projects-and-imagery)
- [Updating company contact information](#updating-company-contact-information)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Going live checklist](#going-live-checklist)

---

## Features

**Public website**

- Home: cinematic real-time 3D hero, layered-depth introduction, interactive services showcase, filterable project showcase, wireframe-to-solid capabilities, isometric process build and a contact stage. The navbar is transparent over dark headers and adapts while scrolling.
- About (vision, mission, values, quality & safety, sustainability, editable team and milestones).
- Services index and nine service detail pages (introduction, key features, workflow, FAQs, related projects, enquiry form).
- Projects gallery with category filters, debounced search, pagination and shareable URLs; project detail pages with specifications, related services, gallery lightbox (keyboard, swipe, focus-trapped) and an enquiry form linked to the project.
- Our Process eight-stage timeline with a scroll-drawn spine.
- Contact page with a validated enquiry form, FAQ page, Privacy Policy and Terms of Use (starter text marked for legal review), 404 page.
- Company details (email, phone, WhatsApp, address, hours, social links, logo) appear only once an admin enters them.

**3D & motion** (React Three Fiber + Drei + Motion — no extra libraries, no external models or HDRs)

- **Hero** (`client/src/three/HeroScene.tsx`): procedural dusk city block — glass tower with instanced curtain wall, concrete blade with a royal-blue LED line, residential block with balconies, cantilevered pavilion, working tower crane, plaza and fogged background city, lit by a procedural reflection environment. Entrance dolly, restrained pointer parallax (fine pointers only), scroll-pinned camera orbit revealing new angles, and window lights switching on as you scroll.
- **Services** (`ServiceScene.tsx`): one canvas with a distinct miniature model per service (house, villa, apartments, tower, retail, district, structural frame, renovation scaffold, masterplan) that crossfade on a turning plinth as you hover or focus a service.
- **Capabilities** (`StructureScene.tsx`): scroll-pinned tower that assembles floor by floor in blueprint wireframe and then fills in with concrete and glass.
- **Process**: isometric SVG structure that draws itself stage by stage (survey → grid → layout → frame → façade & quality checks → handover). Intro uses a CSS-3D layered-depth composition; projects use restrained perspective tilt.
- **Performance**: each scene is a lazy chunk mounted by `SceneMount` only near the viewport, paused off-screen and unmounted (renderer disposed) when far away — at most one live WebGL context in normal scrolling. Instancing for repeated elements, a one-time shadow map, capped/adaptive device pixel ratio (`PerformanceMonitor`), and a lower-cost profile on phones and modest hardware. Measured ~60 fps on integrated Intel Iris Xe graphics.
- **Fallbacks & accessibility**: static architectural imagery without WebGL or after a scene error; `prefers-reduced-motion` renders a single static 3D frame, unpins the hero and disables scroll/pointer camera motion; all content and CTAs are plain HTML, keyboard reachable and readable without the 3D.

**Admin dashboard (`/admin`)**

- Dashboard: total/new enquiries, project and service counts, status summary, recent enquiries, email-delivery warning.
- Projects: create, edit, delete (with confirmation), publish/unpublish, featured flag, sample flag, cover image + ordered gallery (URL or upload), specifications, related services, slug and SEO fields.
- Services: create, edit, hide/show, reorder, delete; features, workflow steps and FAQs.
- Enquiries: search, status filter, detail view, status changes (New, Contacted, In Progress, Closed), internal notes, delete, CSV export.
- Settings: company name, tagline, contact details, social links, logo, SEO defaults.
- Roles: `OWNER`, `ADMIN`, `EDITOR` (editors manage content only; enquiries and settings need ADMIN+). No public registration.

**Backend**

- REST API (Express 5 + TypeScript) with Zod validation, consistent `{ data, meta }` / `{ error }` responses, pagination and filtering — see [`docs/API.md`](docs/API.md).
- PostgreSQL via Prisma 7 with migrations, indexes and safe deletion rules.
- Dynamic `sitemap.xml` and `robots.txt`.

## Technology stack

| Layer | Technology |
| ----- | ---------- |
| Front end | React 19, Vite 8, TypeScript 5.9, Tailwind CSS 4, React Router 7, Motion (Framer Motion), Three.js + React Three Fiber + Drei, Lucide icons, React Hook Form + Zod |
| Back end | Node.js 20.19+ (tested on 24), Express 5, TypeScript, Zod, bcryptjs, Helmet, express-rate-limit, Multer, Nodemailer |
| Database | PostgreSQL 17 (Docker for development), Prisma ORM 7 with `@prisma/adapter-pg` |
| Testing | Vitest, React Testing Library, Supertest, Playwright |

## Project structure

```
Sky_Break/
├─ client/                    React front end
│  ├─ public/                 favicon
│  └─ src/
│     ├─ components/          UI primitives, layout, admin UI, cards, forms, SEO
│     ├─ data/                editorial content and image references
│     ├─ hooks/               data fetching, settings and auth context
│     ├─ layouts/             public and admin layouts
│     ├─ lib/                 API client, site config, formatting, form schema
│     ├─ pages/  pages/admin/ route components
│     ├─ sections/home/       home page sections (hero, 3D experience, …)
│     ├─ styles/              Tailwind theme and global styles
│     ├─ three/               procedural 3D scene (lazy-loaded)
│     ├─ test/                unit/component tests
│     └─ types/               shared API types
├─ server/                    Express API
│  ├─ prisma/                 schema, migrations, seed + seed data
│  ├─ scripts/create-admin.ts secure admin setup
│  ├─ src/
│  │  ├─ config/              environment validation
│  │  ├─ controllers/         HTTP handlers
│  │  ├─ middleware/          auth, CSRF, roles, validation, rate limits, errors
│  │  ├─ routes/              public, auth, admin, SEO routers
│  │  ├─ schemas/             Zod request schemas
│  │  ├─ services/            database and domain logic, email, uploads
│  │  └─ utils/
│  └─ tests/                  Supertest API tests
├─ e2e/                       Playwright end-to-end tests
├─ docs/                      API reference, image credits
├─ docker-compose.yml         local PostgreSQL
└─ .env.example
```

## Prerequisites

- **Node.js 20.19 or newer** (developed with Node 24) and npm 10+
- **PostgreSQL 15+** — easiest via **Docker Desktop**, or a local/hosted PostgreSQL server
- Git (optional)

## Quick start (Windows PowerShell)

```powershell
# 1. Install dependencies (root, client and server workspaces)
npm install

# 2. Create your environment file and set a strong SESSION_SECRET
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    → paste the output as SESSION_SECRET in .env

# 3. Start PostgreSQL (Docker Desktop must be running)
npm run db:up

# 4. Apply migrations and load demo content
npm run db:deploy
npm run db:seed

# 5. Create your administrator account (prompts for a password)
#    First set ADMIN_EMAIL and ADMIN_NAME in .env
npm run admin:create

# 6. Run the API and website together
npm run dev
```

Open **http://localhost:5173** for the website and **http://localhost:5173/admin** for the dashboard. The API runs on http://localhost:4000 and is proxied by Vite under `/api`.

## Environment configuration

All configuration lives in a single `.env` file at the project root (git-ignored). The server validates it at startup and refuses to start with a readable list of problems if something is missing or invalid.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | ✔ | PostgreSQL connection string. The Docker database is `postgresql://skybreak:skybreak_dev_password@localhost:5434/skybreak?schema=public` |
| `SESSION_SECRET` | ✔ | Random string, **at least 32 characters**. Used for IP hashing; rotate it to invalidate fingerprints |
| `SESSION_TTL_HOURS` | | Admin session lifetime (default 8) |
| `NODE_ENV` | | `production` on servers. Leave unset for development (see note below) |
| `SERVER_PORT` | | API port (default 4000) |
| `CLIENT_URL` | | Comma-separated CORS allowlist of front-end origins |
| `PUBLIC_SITE_URL` | | Canonical public URL used in the sitemap and robots.txt (e.g. `https://www.your-domain.example`) |
| `TRUST_PROXY` | | `true` behind a reverse proxy/load balancer so rate limiting sees real client IPs |
| `SERVE_CLIENT` | | `true` to serve the built front end from Express (single-server deployment) |
| `ADMIN_EMAIL`, `ADMIN_NAME` | | Used by `npm run admin:create` |
| `ADMIN_PASSWORD` | | Only for non-interactive setup; remove afterwards |
| `EMAIL_PROVIDER` | | `none` (default) or `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `ENQUIRY_NOTIFY_TO` | when `smtp` | Enquiry notification settings |
| `UPLOAD_DIR`, `MAX_UPLOAD_MB` | | Local upload folder (relative to `server/`) and size limit (default 5 MB) |
| `VITE_PUBLIC_SITE_URL` | | Canonical origin used by the front end for canonical/Open Graph URLs. **Public value — never put secrets in `VITE_*` variables** |

> **Note on `NODE_ENV`:** Vite reads the same `.env`. If it contains `NODE_ENV=development`, `vite build` produces a slow development React build. Leave `NODE_ENV` unset locally (the server defaults to development) and set `NODE_ENV=production` on production machines.

## Database setup and migrations

**Option A — Docker (recommended for development)**

```powershell
npm run db:up      # starts postgres:17-alpine on host port 5434 (avoids clashing with other local databases)
npm run db:down    # stops it (data is kept in the skybreak_pgdata volume)
```

To use a different host port: `$env:POSTGRES_HOST_PORT=5433; npm run db:up` and update `DATABASE_URL`.

**Option B — your own PostgreSQL**

Create a database and user, then set `DATABASE_URL`, for example:
`postgresql://USER:PASSWORD@HOST:5432/skybreak?schema=public` (add `&sslmode=require` for most hosted providers).

**Migrations**

```powershell
npm run db:deploy                 # apply existing migrations (CI / production / first setup)
npm run db:migrate                # development: create + apply a new migration after editing schema.prisma
npm run db:studio -w server       # browse data with Prisma Studio
```

The schema is in `server/prisma/schema.prisma`; migrations are in `server/prisma/migrations/`. The Prisma client is generated into `server/src/generated/` (git-ignored) by `npm run build` or `npm run db:generate -w server`.

> SQLite is **not** supported by this schema (it uses PostgreSQL-specific features such as case-insensitive search and `TEXT` columns). Use Docker or a free hosted PostgreSQL instance for development.

## Seed / demo data

```powershell
npm run db:seed
```

Creates:

- the default company settings row (name and tagline only — **no** contact details),
- nine services with content, workflows and FAQs,
- eight **illustrative sample projects** (`isSample = true`, published) using licensed stock photography.

The seed is idempotent: records that already exist (matched by slug) are never modified, so it is safe to run again and it will not overwrite edits made in the dashboard. It never creates admin users.

## Creating the first admin

There is no public registration. Create accounts from the command line:

```powershell
# Set ADMIN_EMAIL and ADMIN_NAME in .env first
npm run admin:create                          # prompts for the password (hidden)
npm run admin:create -- --role ADMIN          # OWNER (default) | ADMIN | EDITOR
npm run admin:create -- --email someone@company.example --name "Site Editor" --role EDITOR
npm run admin:create -- --reset               # reset the password for ADMIN_EMAIL and sign out its sessions
```

Passwords must be at least 12 characters and include upper-case, lower-case and a number. They are hashed with bcrypt (cost 12); plaintext passwords are never stored or logged.

For automated environments you may set `ADMIN_PASSWORD` temporarily — remove it from the environment afterwards.

## Running locally

```powershell
npm run dev                 # API (tsx watch) + website (Vite) together
npm run dev -w server       # API only  → http://localhost:4000
npm run dev -w client       # website only → http://localhost:5173 (proxies /api, /uploads, /sitemap.xml, /robots.txt)
```

Useful URLs: `/api/health`, `/sitemap.xml`, `/robots.txt`, `/admin/login`.

## Running tests

```powershell
npm run typecheck           # TypeScript (server + client)
npm run lint                # ESLint (server + client)
npm test                    # API tests (Supertest) + front-end tests (Vitest/RTL)
npx playwright install chromium   # once, before the first e2e run
npm run test:e2e            # Playwright end-to-end tests in a real browser
```

- **API tests** need PostgreSQL. They use a separate database named `<your database>_test` (e.g. `skybreak_test`), which is created and migrated automatically. Set `TEST_DATABASE_URL` to override.
- **End-to-end tests** start their own isolated stack (API on port 4100 using the `_test` database, website on port 5180), reset and seed that database, and create a temporary admin. They never touch your development data. Ports 4100 and 5180 must be free.

What is covered: public endpoints, filtering, 404s, sitemap/robots, security headers and CORS; enquiry validation, honeypot, timing check, idempotency, payload limits and rate limits; login/logout, cookie flags, expired and forged sessions, CSRF enforcement, role permissions, protection of every admin route; project/service/enquiry/settings CRUD, CSV export with formula-injection protection, and image upload validation. In the browser: home page and 3D canvas, filters/search/detail/lightbox, internal link check, no horizontal overflow and no broken images on every public page at 375/768/1024/1440 px, mobile navigation, contact form validation and submission, and the full admin workflow.

## Production build

```powershell
npm run build               # generates the Prisma client, compiles the server to server/dist, builds the client to client/dist
```

Run the compiled server (single-server mode serving the website and API from one origin):

```powershell
# in .env on the server: NODE_ENV=production, SERVE_CLIENT=true, PUBLIC_SITE_URL=https://…, CLIENT_URL=https://…
npm run db:deploy
npm start
```

## Deployment

**Recommended: one Node process behind HTTPS**

1. Provision PostgreSQL (managed service or your own server) and a Node.js 20.19+ host.
2. Copy the repository, create `.env` with production values (`NODE_ENV=production`, a fresh `SESSION_SECRET`, production `DATABASE_URL`, `PUBLIC_SITE_URL`, `CLIENT_URL` = your site origin, `SERVE_CLIENT=true`, `TRUST_PROXY=true` if behind a proxy).
3. `npm ci` → `npm run build` → `npm run db:deploy` → `npm run db:seed` (optional) → `npm run admin:create`.
4. Run `npm start` under a process manager (systemd, PM2, a container, or your platform's service runner).
5. Put it behind a reverse proxy or platform load balancer that terminates **HTTPS** (session cookies are `Secure` in production, so HTTPS is required for admin sign-in).
6. Make sure `server/uploads/` is on persistent storage and backed up (or use object storage — see below).

**Alternative: static front end + separate API**

Host `client/dist` on a static host/CDN, and the API separately. Configure the static host to route `/api/*`, `/uploads/*`, `/sitemap.xml` and `/robots.txt` to the API (same-origin proxying keeps cookies `SameSite=Strict` and CSP intact), and add an SPA fallback to `index.html`.

**Docker** is used only for the development database. A production image can be built with a standard multi-stage Node Dockerfile running the steps above.

## Email notifications

Enquiries are **always saved to the database**. Email is optional:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=…
SMTP_PASS=…
EMAIL_FROM="Skybreak Infra Website <no-reply@your-domain.example>"
ENQUIRY_NOTIFY_TO=enquiries@your-domain.example
```

When email is disabled, the dashboard shows a warning, `/api/health` reports `email: "disabled"`, and the visitor's success message says that no automatic email confirmation is sent. If sending fails, the enquiry is still stored and marked "Email notification: Not sent". Delivery has not been verified with a real SMTP provider in this repository — test it with your provider before launch.

## Image storage

Uploads from the dashboard are validated (JPEG/PNG/WebP/AVIF, signature checked, size-limited), given random file names and stored on local disk in `server/uploads/`, served from `/uploads/…`. For multi-server or ephemeral hosting, mount a persistent volume there or replace `server/src/services/upload.service.ts#saveImage` with an object-storage upload (S3-compatible, Cloudinary, etc.) that returns a public URL, and add that host to the CSP `img-src` list in `server/src/app.ts`.

Remote image URLs may also be pasted into any image field. The CSP currently allows images from the site itself and `images.unsplash.com`; add any other image host to `img-src`.

## Brand assets and logo

The official logo supplied by the company is stored in `client/public/brand/` and served from `/brand/…` in development and production:

| File | What it is | Used in |
| ---- | ---------- | ------- |
| `skybreak-infra-logo.png` | **Original, unmodified** logo (1300 × 748) | Organization structured data (JSON-LD) |
| `skybreak-infra-logo-cropped.png` | Same artwork with surrounding white space trimmed (794 × 572) | Home hero card, footer, admin login, admin sidebar |
| `skybreak-infra-mark.png` | The eye-and-house symbol cropped from the logo (687 × 335) | Navbar, admin mobile header |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `/favicon.ico` | The symbol centred on a white square and downscaled | Browser tab, home-screen icons, `site.webmanifest` |

The variants are crop/downscale only; the design and colours are unchanged. The artwork has an opaque white background (the inside of the eye is also white), so it is never made transparent — on dark surfaces it is shown on a white tile.

The company name (**Skybreak Infra Pvt Ltd**), tagline (**ELEVATING EXCELLENCE**), asset paths, alt text (`Skybreak Infra Pvt Ltd logo`) and the logo blue (`#3360B5`, Tailwind colour `brand`) are defined once in `client/src/lib/brand.ts`. The server's defaults for a new settings row are in `server/src/config/brand.ts`. Name and tagline remain editable in **Admin → Settings**; uploading a logo there replaces the navbar/footer artwork.

## Replacing demo projects and imagery

1. Sign in at `/admin` → **Projects**. For each sample project, either edit it with real information and **turn off "Illustrative sample"**, or delete it.
2. Add real projects with your own photography (upload or URL) and descriptive alt text.
3. Site-wide photography (hero, about, CTA, process) is referenced in `client/src/data/images.ts` and `client/src/data/content.ts`. Service hero images are edited in **Admin → Services**.
4. Team members and milestones are intentionally empty — add verified entries in `client/src/data/content.ts` (`team`, `milestones`).
5. Photo sources are listed in [`docs/IMAGE_CREDITS.md`](docs/IMAGE_CREDITS.md).

## Updating company contact information

Go to **Admin → Settings** and enter the verified company email, phone, WhatsApp, office address, hours, social links, logo and SEO defaults. Empty fields are hidden across the website. These values also populate the Organization structured data (JSON-LD). Fallback defaults (name, tagline, description) live in `client/src/lib/config.ts`.

## Security notes

- **Authentication:** server-side sessions in PostgreSQL; the cookie holds a random 256-bit token and only its SHA-256 hash is stored. Cookies are `HttpOnly`, `SameSite=Strict`, `Secure` in production. Login replaces any existing session; password resets sign out all sessions.
- **CSRF:** synchroniser token required in `X-CSRF-Token` for all state-changing admin requests, in addition to SameSite cookies and the CORS allowlist.
- **Authorisation:** every `/api/admin/*` route is protected on the server (session + role checks); the React route guard is for convenience only.
- **Passwords:** bcrypt (cost 12); constant-time comparison even for unknown emails to avoid account enumeration; login rate limited.
- **Input:** Zod validation on every endpoint; Prisma parameterised queries; JSON body limit 200 KB; upload type/signature/size checks; HTML-escaped notification emails; CSV formula-injection protection.
- **Abuse:** rate limits on all APIs, enquiries and login; honeypot field and minimum fill-time check; idempotency key prevents duplicate submissions.
- **Headers:** Helmet with a strict Content-Security-Policy (`script-src 'self'`, `frame-ancestors 'none'`), HSTS, `nosniff`, referrer policy; `X-Powered-By` removed.
- **Privacy:** IP addresses are stored only as keyed hashes; logs never include request bodies, cookies or credentials; admin responses are `Cache-Control: no-store`.
- **Secrets:** `.env` is git-ignored; only `VITE_*` values reach the browser and they must never contain secrets. The Docker credentials in `docker-compose.yml` are for local development only.

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `Invalid environment configuration` on start | Read the listed variables, compare with `.env.example`. `SESSION_SECRET` must be 32+ characters. |
| `npm run db:up` → "port is already allocated" | Another PostgreSQL uses that port. Run with `$env:POSTGRES_HOST_PORT=5435; npm run db:up` and update `DATABASE_URL`. |
| `Can't reach database server` | Start Docker Desktop, then `npm run db:up`; check `DATABASE_URL` host/port. |
| `Cannot find module …/generated/prisma/client.js` | Run `npm run db:generate -w server` (or `npm run build`). |
| Admin login works on localhost but not on the live site | HTTPS is required in production (`Secure` cookie). Also check `TRUST_PROXY=true` behind a proxy. |
| `CORS_REJECTED` / 403 from the API | Add the site origin to `CLIENT_URL` (comma-separated). |
| "Security token missing or invalid" in the dashboard | Your session expired or was reset — refresh the page and sign in again. |
| Images from a new host don't appear | Add the host to `img-src` in the CSP (`server/src/app.ts`). |
| 3D model shows a static image | The browser has WebGL disabled/unavailable — this is the intended fallback. |
| Production bundle is unexpectedly large / dev React warnings | Remove `NODE_ENV=development` from `.env` before `npm run build`. |
| e2e tests fail to start | Make sure ports 4100/5180 are free and run `npx playwright install chromium`. |

## Going live checklist

- [ ] Enter verified contact details, social links and logo in **Admin → Settings**
- [ ] Replace or delete all sample projects; untick "Illustrative sample" only for real work
- [ ] Review service content and remove anything the company does not offer
- [ ] Complete and legally review the Privacy Policy and Terms of Use (`[REVIEW]` markers in `client/src/pages/Legal.tsx`)
- [ ] Set `PUBLIC_SITE_URL`, `VITE_PUBLIC_SITE_URL` and `CLIENT_URL` to the real domain
- [ ] Generate a new `SESSION_SECRET`; set `NODE_ENV=production`
- [ ] Serve over HTTPS; configure backups for the database and uploads
- [ ] Configure and test SMTP notifications (optional)
- [ ] Submit `/sitemap.xml` to search engines
