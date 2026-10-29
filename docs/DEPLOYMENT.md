# Production deployment — Netlify + Render (free) + Neon + Brevo

This is the free-tier setup for **https://skybreak-infra.netlify.app**:

| Part | Host | Plan |
| ---- | ---- | ---- |
| Website (React/Vite) | Netlify — `netlify.toml` | Free |
| API (Express) | Render web service — `render.yaml` | Free |
| PostgreSQL | Neon (external; Render creates no database) | Free |
| Email (optional) | Brevo SMTP relay | Free |

No secrets are stored in this repository (it is public). Every value marked *dashboard* below is
typed into the host's dashboard.

## Architecture

```
Browser ──► https://skybreak-infra.netlify.app   (Netlify: static React app)
              │  /api/*, /uploads/*, /sitemap.xml, /robots.txt   (Netlify proxy rewrite, status 200)
              ▼
            https://<your-api>.onrender.com   (Render free web service: Express API)
              │  DATABASE_URL (Render only)            │  SMTP, port 2525 (optional)
              ▼                                         ▼
            Neon PostgreSQL (free)                    Brevo SMTP relay
```

**Why the proxy:** Netlify only serves static files — it does not run the Express server. With the
proxy, the browser talks only to the site's own domain, so:

- the admin session cookie stays first-party (`HttpOnly; Secure; SameSite=Strict`) and is not
  blocked by browsers that block third-party cookies (Safari, Firefox, Chrome settings);
- no CORS preflights, and the strict Content-Security-Policy keeps `connect-src 'self'`;
- uploaded images and the sitemap are served from the site's domain.

Requests pass through two proxies (Netlify, then Render's load balancer), which is why the API
uses `TRUST_PROXY=2`.

## Free-tier limitations (read first)

| Limitation | Effect on this site | What to do |
| ---------- | ------------------- | ---------- |
| **Render: spins down after 15 minutes without traffic** | The first visitor after a quiet period waits about a minute. The website waits 25 s per request and then shows "The server is taking too long to respond. Please try again in a moment." (no automatic retry). | Accept it, or upgrade the Render plan. |
| **Render: no pre-deploy command** | Migrations run at the end of the build instead (see [Migrations](#migrations)). | Nothing — `render.yaml` already does this. |
| **Render: no persistent disk, ephemeral filesystem** | Images uploaded in the admin are written to `server/uploads` and are **deleted on every redeploy, restart and spin-down**. | Use image URLs in the admin (as the seeded projects do), or add object storage later. |
| **Render: no Shell** | Scripts such as `admin:create` cannot be run on Render. | Run them from your own computer against Neon (see [First administrator](#4-first-administrator)). |
| **Render: outbound SMTP on ports 25, 465 and 587 blocked** | Standard SMTP ports fail. | Brevo on port **2525** (set in `render.yaml`). |
| **Render: 750 free instance hours per month** (per workspace) | One always-on service fits; several free services share the hours. | Keep only this one free service. |
| **Render: `sync: false` values are asked for only when the Blueprint is first created** | Later Blueprint syncs don't prompt for them again. | Change them under the service's **Environment** tab. |
| **Neon Free: compute suspends when idle, limited storage and compute hours** | The first query after a pause takes a little longer; the API waits up to 10 s to connect. | Fine for this site's size. Check usage in the Neon console. |
| **Brevo Free: daily sending limit** | Verification codes and enquiry alerts stop for the day once it's reached. | Check the current limit in Brevo; enquiries are still saved in the admin. |

Free-plan limits change — check render.com/docs/free, neon.com/pricing and brevo.com/pricing.

## 1. Database — Neon

1. Create a Neon project in **AWS Asia Pacific (Singapore)**, the same region as the Render
   service (`region: singapore` in `render.yaml`). If you choose another region, change both.
2. Copy the **direct** connection string: on the Connect dialog turn **Connection pooling off**
   (the host must *not* contain `-pooler`). It looks like
   `postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/<database>?sslmode=require`.
   Make sure it ends in `?sslmode=require`.
   The same string is used by the app and by `prisma migrate deploy`; migrations need a direct
   connection.
3. Keep this string private. It goes **only** into Render's `DATABASE_URL` (and temporarily into
   your own terminal for the one-off scripts below) — never into Netlify, a `VITE_*` variable,
   `.env.example` or Git.

`DB_POOL_MAX=5` keeps the API well inside Neon's connection limit.

## 2. API — Render (free web service)

Render dashboard → **New → Blueprint** → select the GitHub repository → Render reads `render.yaml`
→ fill in the values it asks for (table below) → **Apply**.

What `render.yaml` sets up:

| Setting | Value |
| ------- | ----- |
| Service | `skybreak-api`, web, `plan: free`, `region: singapore` |
| Runtime | Node (`.node-version` pins Node 22) |
| Root directory | repository root (npm workspaces use the single root `package-lock.json`) |
| Build command | `npm ci --include=dev && npm run build -w server && npm run db:deploy -w server` |
| Start command | `npm run start -w server` |
| Health check | `/health` (process only — answers without the database) |
| Database | none — `DATABASE_URL` points to Neon |
| Disk | none (not available on the free plan) |

What the build command does, in order:

1. `npm ci --include=dev` — clean install from the lockfile. `--include=dev` is required because
   `NODE_ENV=production` would otherwise make npm skip TypeScript and the Prisma CLI.
2. `npm run build -w server` — `prisma generate` (creates `server/src/generated`, which is not in
   Git; it needs no database) and then `tsc` compiles to `server/dist`.
3. `npm run db:deploy -w server` — `prisma migrate deploy` (see next section).

### Migrations

- `prisma migrate deploy` **only applies migrations that have not run yet**. It never resets,
  drops or seeds data and never runs `db push`. Seeding is never part of a deploy.
- It runs at the end of the build because the free plan has no pre-deploy step. Render switches
  traffic to the new version only after the build succeeds, so **migrations are applied before
  the new code serves any request**.
- If a migration fails, the build fails, Render cancels the deploy and **the previous version
  keeps running**. Fix the migration and redeploy.
- The previous version is still live while a migration runs, so keep migrations
  backward-compatible: add new columns/tables first, remove old ones in a later deploy.
- Never run `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against Neon.

### Render environment variables

Values set in `render.yaml` (change them in the file, or override under **Environment**):

| Variable | Value | Notes |
| -------- | ----- | ----- |
| `NODE_ENV` | `production` | |
| `DB_POOL_MAX` | `5` | |
| `SESSION_SECRET` | generated by Render | 256-bit random value. Hashes stored IP addresses and email codes; rotating it invalidates pending email codes. |
| `CLIENT_URL` | `https://skybreak-infra.netlify.app` | Exact site origin(s), comma-separated, no trailing slash. POSTs from other origins are rejected. Add a custom domain here later. |
| `PUBLIC_SITE_URL` | `https://skybreak-infra.netlify.app` | Canonical URL for `sitemap.xml` and `robots.txt`. |
| `TRUST_PROXY` | `2` | Netlify proxy + Render load balancer. |
| `COOKIE_SAMESITE` | `strict` | Correct with the Netlify proxy. |
| `SERVE_CLIENT` | `false` | Netlify serves the website. |
| `SMTP_HOST` | `smtp-relay.brevo.com` | |
| `SMTP_PORT` | `2525` | Render free blocks 25/465/587. |
| `SMTP_SECURE` | `false` | Not implicit TLS; Nodemailer upgrades with STARTTLS when Brevo offers it. |
| `EMAIL_DOMAIN_CHECK` | `true` | Rejects enquiry email domains that cannot receive mail. |
| `PORT` | set by Render | Do not add it. |

Values you type in the dashboard (`sync: false`):

| Variable | What to enter |
| -------- | ------------- |
| `DATABASE_URL` | The Neon **direct** connection string ending in `?sslmode=require`. |
| `EMAIL_PROVIDER` | `smtp` once Brevo is set up (section 3), otherwise `none`. |
| `SMTP_USER` | Brevo SMTP login (only with `smtp`). |
| `SMTP_PASS` | Brevo **SMTP key** — not an API key (only with `smtp`). |
| `EMAIL_FROM` | A sender verified in Brevo, e.g. `Skybreak Infra Pvt Ltd <sender@your-verified-domain>`. |
| `ENQUIRY_NOTIFY_TO` | The inbox that receives new-enquiry alerts. |

Optional, with sensible defaults (add only to change them): `SESSION_TTL_HOURS` (8),
`MAX_UPLOAD_MB` (5), `UPLOAD_DIR` (`uploads`).

The server checks its configuration at start-up and refuses to start, listing the variable names
(never the values), if something is wrong — e.g. `SESSION_SECRET` shorter than 32 characters, or
`EMAIL_PROVIDER=smtp` without `SMTP_HOST`, `EMAIL_FROM` or `ENQUIRY_NOTIFY_TO`.

`ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` do **not** belong on Render; they are used only by
the admin script on your computer.

## 3. Email — Brevo (optional)

Email is used for two things: verification codes for customers who don't give an Indian mobile
number, and new-enquiry alerts to `ENQUIRY_NOTIFY_TO`.

**Without email** (`EMAIL_PROVIDER=none`): enquiries are still saved and shown in the admin, but
no alerts are sent, and customers without an Indian mobile number are asked to enter one (the
email-code endpoint answers `503 EMAIL_UNAVAILABLE`; no code is ever shown in production).

**To enable Brevo:**

1. Brevo → **Senders, Domains & Dedicated IPs** → add and verify the sender address you'll use in
   `EMAIL_FROM`. Authenticating the domain (DKIM/DMARC) is strongly recommended — a Gmail
   address as the sender is likely to land in spam.
2. Brevo → **Settings → SMTP & API → SMTP** tab → note the **Login** and generate an **SMTP key**.
3. Render → `skybreak-api` → **Environment**: set `EMAIL_PROVIDER=smtp`, `SMTP_USER` (login),
   `SMTP_PASS` (SMTP key), `EMAIL_FROM`, `ENQUIRY_NOTIFY_TO` → **Save, rebuild and deploy**.
   Leave `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=2525`, `SMTP_SECURE=false`.
4. Check `https://skybreak-infra.netlify.app/api/health`: it should show `"email":"configured"`. Then send a test enquiry with an email address only and confirm the code and the
   alert arrive.

## 4. First administrator

Render's free plan has no Shell, so the admin account is created **from your own computer**,
pointing the existing script at Neon for that one command. You need a fresh clone set up as in the
README Quick Start (steps 1–3: `npm install`, `npm run db:generate -w server`, a `.env` with a
`SESSION_SECRET`).

Do this after the first successful Render deploy, so the tables exist. Use a **new PowerShell
window** and close it afterwards, so the production connection string can't leak into later local
commands:

```powershell
# New PowerShell window, in the project folder.
# Values typed here override .env for this window only. Paste the Neon direct string yourself.
$env:DATABASE_URL = "<Neon direct connection string>"
$env:ADMIN_EMAIL  = "<your admin email>"
$env:ADMIN_NAME   = "<your name>"

npm run admin:create      # prompts twice for the password (hidden); 12+ chars, upper, lower, digit

# Optional, once: load the service list and company settings without the sample projects.
# It only adds missing records and never changes existing ones.
$env:SEED_SAMPLE_PROJECTS = "false"; npm run db:seed

exit                       # close the window: the variables above disappear with it
```

Then sign in at `https://skybreak-infra.netlify.app/admin/login`. To reset a forgotten password,
repeat with `npm run admin:create -- --reset` (it also signs out existing sessions).

Don't set `ADMIN_PASSWORD` for this; the hidden prompt keeps the password out of your shell
history. Don't put the Neon string in `.env` — `npm run dev` would then run against production.

## 5. Website — Netlify

`netlify.toml` (repository root) already sets:

| Setting | Value |
| ------- | ----- |
| Base directory | *(repository root)* |
| Build command | `npm run build -w client` |
| Publish directory | `client/dist` |
| Node | 22 |

Settings in `netlify.toml` take precedence over the Netlify UI. If the site was set up by hand
earlier (e.g. publish directory `dist`, or a drag-and-drop deploy), link it to the GitHub
repository under **Site configuration → Build & deploy → Link repository** and clear stale UI
values.

**Netlify environment variables (Site configuration → Environment variables):**

| Variable | Value |
| -------- | ----- |
| `API_PROXY_ORIGIN` | The Render service URL, e.g. `https://skybreak-api.onrender.com` (copy the exact one from Render) — `https://`, origin only, no path, no trailing slash. |
| `VITE_PUBLIC_SITE_URL` | `https://skybreak-infra.netlify.app` — the same value as `PUBLIC_SITE_URL` on Render. |

Do **not** add `DATABASE_URL`, `SESSION_SECRET`, SMTP credentials or `NODE_ENV=production` to
Netlify (the build needs devDependencies). Everything in `VITE_*` is public.

The build writes `client/dist/_redirects` (proxy rules for `/api/*`, `/uploads/*`, `/sitemap.xml`,
`/robots.txt`, plus the SPA fallback for deep links such as `/admin`) and `client/dist/_headers`
(CSP and caching). On Netlify the build **fails with an explanatory message** if
`API_PROXY_ORIGIN` is missing, isn't `https://`, has a path, or points to `localhost`.

After changing environment variables: **Deploys → Trigger deploy → Clear cache and deploy site**.

**Keep the three URLs consistent.** For a custom domain later, update all of them together:
Netlify `VITE_PUBLIC_SITE_URL`, Render `PUBLIC_SITE_URL`, and Render `CLIENT_URL` (add the new
origin, comma-separated).

**Deploy previews** have their own origin (`deploy-preview-N--skybreak-infra.netlify.app`). Pages
load through the proxy, but forms and admin actions are rejected unless that origin is added to
`CLIENT_URL`. Use the production site for admin work.

## 6. Order of first deployment

1. Neon: create the project (Singapore), copy the direct connection string.
2. Render: create the Blueprint, enter the `sync: false` values (`EMAIL_PROVIDER=none` is fine to
   start), apply. The first build applies all migrations to the empty Neon database.
3. Check `https://<api>.onrender.com/api/health` → `"database":"up"`.
4. From your computer: create the first admin, optionally seed (section 4).
5. Netlify: set `API_PROXY_ORIGIN` and `VITE_PUBLIC_SITE_URL`, deploy.
6. Brevo (optional, any time later): section 3.
7. Run the checks below.

## 7. Verify the live deployment

Replace `<api>` with the Render hostname. The first request after a pause can take about a
minute while the service wakes.

| Check | Expected |
| ----- | -------- |
| `https://<api>.onrender.com/health` | `{"status":"ok","uptime":…}` — process is up (no DB check) |
| `https://<api>.onrender.com/api/health` | `"database":"up"` — API **and** Neon reachable |
| `https://skybreak-infra.netlify.app/api/health` | same JSON — the Netlify proxy reaches the API |
| `https://skybreak-infra.netlify.app/api/services` | JSON with the services (`data: []` until seeded) |
| `https://skybreak-infra.netlify.app/admin`, then refresh | app loads, redirects to `/admin/login` |
| `https://skybreak-infra.netlify.app/sitemap.xml` | URLs on `https://skybreak-infra.netlify.app` |

Then in a browser (DevTools → Network/Console open):

1. Home page: the 3D hero renders, Services load, no red console errors or CSP violations.
2. Projects and a project detail page load; refresh the detail page.
3. Submit a test enquiry on /contact → success message (with Brevo: the alert arrives).
4. Sign in at `/admin/login` → the dashboard shows the enquiry; reload — you stay signed in.
   DevTools → Application → Cookies: `sb_session` is `HttpOnly`, `Secure`, `SameSite=Strict`.
5. Sign out → `/admin` returns to the login page.

**If something fails:**

| Symptom | Likely cause |
| ------- | ------------ |
| Render build fails at `prisma migrate deploy` | `DATABASE_URL` wrong, pooled (`-pooler`) host, or missing `sslmode=require`. The previous version keeps running. |
| Render deploy fails right after start, log says `Invalid environment configuration` | A listed variable is missing or invalid (e.g. `EMAIL_PROVIDER=smtp` without `EMAIL_FROM`). |
| `/api/services` gives `502`/`504` | API asleep (wait a minute and retry) or wrong `API_PROXY_ORIGIN`. |
| `/api/services` gives HTML instead of JSON | Proxy rules missing — redeploy Netlify with `API_PROXY_ORIGIN` set. |
| `503 DATABASE_UNAVAILABLE`, `/api/health` shows `"database":"down"` | Neon unreachable or `DATABASE_URL` wrong. |
| `403 CORS_REJECTED` on forms | Add the site origin to `CLIENT_URL`. |
| Email codes not arriving | `EMAIL_PROVIDER` isn't `smtp`, wrong SMTP key, sender not verified in Brevo, or the daily limit was reached. Render logs show `[email]` lines. |
| Project images disappeared | They were uploaded files, wiped on redeploy/spin-down. Re-add them as image URLs. |

## Alternatives

**Direct cross-origin API (no proxy):** set `VITE_API_URL=https://<api>/api` on Netlify instead of
`API_PROXY_ORIGIN`, and on Render `COOKIE_SAMESITE=none`, `TRUST_PROXY=1`. The session cookie then
becomes a third-party cookie, which many browsers reject, so admin sign-in may not persist. Prefer
the proxy.

**Single server:** the API can serve the built website itself (`SERVE_CLIENT=true`,
`npm run build`, `npm start`), replacing Netlify.

**Paid Render plan:** removes the spin-down and allows a pre-deploy command (move
`npm run db:deploy -w server` there) and a persistent disk for uploads (`disk:` in `render.yaml`).
