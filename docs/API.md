# Skybreak Infra — REST API

Base path: `/api`. All request and response bodies are JSON unless stated otherwise.

## Conventions

**Success**

```json
{ "data": { ... } }
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 12, "total": 30, "totalPages": 3 } }
```

**Error**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid.", "details": [{ "path": "email", "message": "Please enter a valid email address" }] } }
```

| Status | Code(s)                                   | Meaning                                    |
| ------ | ----------------------------------------- | ------------------------------------------ |
| 400    | `BAD_REQUEST`, `BAD_JSON`, `UPLOAD_ERROR` | Malformed request                          |
| 401    | `UNAUTHORIZED`, `INVALID_CREDENTIALS`     | No/expired session, or wrong credentials   |
| 403    | `FORBIDDEN`, `CSRF_INVALID`, `CORS_REJECTED` | Role too low, missing CSRF token, bad origin |
| 404    | `NOT_FOUND`                               | Unknown route or record                    |
| 409    | `CONFLICT`                                | Duplicate slug                             |
| 413    | `PAYLOAD_TOO_LARGE`                       | JSON body over 200 KB                      |
| 422    | `VALIDATION_ERROR`                        | Field validation failed (see `details`)    |
| 429    | `RATE_LIMITED`                            | Too many requests                          |
| 500    | `INTERNAL_ERROR`                          | Unexpected server error (details are logged, not returned) |
| 503    | `DATABASE_UNAVAILABLE`                    | PostgreSQL cannot be reached right now (`Retry-After: 30`); retry later |
| 503    | `API_UNAVAILABLE`                         | Local development only: the Vite proxy could not reach the API process |

**Pagination**: `?page=1&pageSize=12` (max `pageSize` 100).

**Rate limits** (per client IP): all `/api` routes 300/min · `POST /api/enquiries` 5 per 15 min · failed `POST /api/auth/login` 10 per 15 min.

## Authentication

Admin authentication uses a server-side session:

1. `POST /api/auth/login` sets an `sb_session` cookie (`HttpOnly`, `SameSite=Strict`, `Secure` in production) and returns a `csrfToken`.
2. Every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`) to `/api/admin/*` and `/api/auth/logout` must send the token in an `X-CSRF-Token` header.
3. `GET /api/auth/me` returns the current user and the CSRF token (used after a page reload).

Only a SHA-256 hash of the session token is stored in the database. Sessions expire after `SESSION_TTL_HOURS`.

**Roles**: `EDITOR` < `ADMIN` < `OWNER`.

| Capability                                   | EDITOR | ADMIN | OWNER |
| -------------------------------------------- | :----: | :---: | :---: |
| Dashboard, create/edit projects & services, uploads | ✔ | ✔ | ✔ |
| Delete projects & services                   |        |   ✔   |   ✔   |
| Enquiries (view, update, notes, delete, CSV) |        |   ✔   |   ✔   |
| Company settings                             |        |   ✔   |   ✔   |

---

## Public endpoints

### `GET /api/health`
`200 { data: { status: "ok", database: "up", email: "configured" | "disabled" } }` — `503` when the database is unreachable.

### `GET /api/settings`
Public company details: `companyName, tagline, contactEmail, phone, whatsapp, address, officeHours, socialLinks, logoUrl, seoTitle, seoDescription, ogImageUrl` (empty values are `null`).

### `GET /api/projects`
Published projects only. Query: `category` (`RESIDENTIAL | COMMERCIAL | DEVELOPMENT`), `search`, `featured` (`true|false`), `service` (service slug), `page`, `pageSize`.
Returns summaries: `id, slug, title, summary, category, status, location, coverImageUrl, coverImageAlt, isSample, isFeatured, …`.

### `GET /api/projects/:slug`
Full published project including `description`, `specifications[]`, `images[]`, `services[]`, SEO fields and up to three `related` projects. `404` if missing or unpublished.

### `GET /api/services`
Published services ordered by `sortOrder`.

### `GET /api/services/:slug`
Full service including `intro`, `features[]`, `workflow[]`, `faqs[]` and up to six related published `projects`.

### `POST /api/enquiries`

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+00 000 000 000",
  "projectType": "Residential construction",
  "projectLocation": "City",
  "budgetRange": "optional",
  "expectedStart": "optional",
  "message": "At least 10 characters…",
  "consent": true,
  "projectSlug": "optional-project-slug",
  "sourcePath": "/contact",
  "clientSubmissionId": "uuid (optional idempotency key)",
  "website": "",
  "formStartedAt": 1730000000000
}
```

`projectType` must be one of: Residential construction · Luxury villa / independent house · Apartment / residential complex · Commercial construction · Office / retail space · Warehouse / industrial · Real estate development · Civil & structural works · Renovation / remodeling · Other.

- `201 { data: { id, createdAt, emailNotified, duplicate: false } }`
- `200` with `duplicate: true` when the same `clientSubmissionId` is sent again (no second record is created).
- `website` is a honeypot and must be empty; submissions less than 2.5 s after `formStartedAt` are rejected (`400`).
- `emailNotified: false` means the enquiry was saved but no notification email was sent (SMTP not configured or delivery failed).

#### Contact rules (enforced on the server)

- `phone` is optional. When present it must be an **Indian mobile number** — 10 digits starting with
  6–9, with optional `+91`, `0091`, `91` or `0` prefix; spaces, dashes and brackets are ignored. It is
  stored normalised as `+91XXXXXXXXXX`. Implausible numbers (all one digit, straight runs such as
  `9876543210`) are rejected.
- Without `phone`, `emailCode` is **required**: a 6-digit code obtained from
  `POST /api/enquiries/email-code` for the same email. The enquiry is saved with `emailVerified: true`.
- The email domain must be able to receive mail (DNS MX/A lookup; skipped on DNS errors;
  disable with `EMAIL_DOMAIN_CHECK=false`).
- **Limits:** at most `maxEnquiriesPerEmail` enquiries per email and `maxEnquiriesPerPhone` per mobile
  within `enquiryLimitWindowDays` (defaults 3 / 3 / 30; `0` = unlimited; set in Admin → Settings).
  Exceeding a limit returns `429 { code: "ENQUIRY_LIMIT", details: [{ path: "email" | "phone" }] }`.
  An idempotent resubmission (same `clientSubmissionId`) still returns the original record.

### `POST /api/enquiries/email-code`

Body `{ "email": "…" }`. Sends a 6-digit code (valid 10 minutes, 5 attempts; only the newest code is
valid; only an HMAC of it is stored).

- `200 { data: { expiresInSeconds: 600, resendAfterSeconds: 60, devCode? } }` — `devCode` is returned
  **only** in development/test when email sending is disabled.
- `429 CODE_COOLDOWN` (`details.retryAfter` seconds) — one code per 60 s per email; `429 CODE_LIMIT` —
  more than 5 codes per hour; `429 RATE_LIMITED` — more than 6 requests per 15 min per client.
- `503 EMAIL_UNAVAILABLE` — production without SMTP: the customer is asked for a mobile number.
- `502 EMAIL_SEND_FAILED` — the SMTP provider rejected the message.

Code errors on `POST /api/enquiries` are `422` with `details: [{ path: "emailCode" }]`.

### `GET /sitemap.xml`, `GET /robots.txt`
Generated from published content using `PUBLIC_SITE_URL`.

---

## Auth endpoints

| Method | Path               | Body                  | Response |
| ------ | ------------------ | --------------------- | -------- |
| POST   | `/api/auth/login`  | `{ email, password }` | `200 { data: { user, csrfToken, expiresAt } }` + cookie |
| POST   | `/api/auth/logout` | —                     | `204`, cookie cleared (CSRF required) |
| GET    | `/api/auth/me`     | —                     | `200 { data: { user, csrfToken } }` or `401` |

---

## Admin endpoints (session required)

### Dashboard
`GET /api/admin/dashboard` → `{ totals: { enquiries, newEnquiries, projects, publishedProjects, services }, enquiriesByStatus, recentEnquiries[], emailDelivery }`

### Projects
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/admin/projects` | Query as public list plus `published=true|false`; includes drafts |
| POST | `/api/admin/projects` | Create (body below) → `201` |
| GET | `/api/admin/projects/:id` | Full project |
| PUT | `/api/admin/projects/:id` | Replace (gallery is replaced in the given order) |
| PATCH | `/api/admin/projects/:id/publish` | `{ isPublished: boolean }` |
| DELETE | `/api/admin/projects/:id` | `204`; images cascade, linked enquiries are kept (`projectId` set to null). ADMIN+ |

Project body:

```json
{
  "title": "…", "slug": "optional-kebab-case", "summary": "…", "description": "…",
  "category": "RESIDENTIAL", "status": "CONCEPT | PLANNED | UNDER_CONSTRUCTION | COMPLETED",
  "location": "optional", "coverImageUrl": "https://… or /uploads/…", "coverImageAlt": "…",
  "specifications": [{ "label": "…", "value": "…" }],
  "images": [{ "url": "…", "alt": "…" }],
  "serviceIds": ["…"],
  "isSample": false, "isPublished": false, "isFeatured": false, "sortOrder": 0,
  "seoTitle": "optional (≤70)", "seoDescription": "optional (≤170)"
}
```

If `slug` is omitted, a unique slug is generated from the title.

### Services
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/admin/services` | Includes hidden services |
| POST | `/api/admin/services` | Create |
| PUT | `/api/admin/services/reorder` | `{ ids: [...] }` in display order |
| GET / PUT | `/api/admin/services/:id` | Read / replace |
| DELETE | `/api/admin/services/:id` | ADMIN+ |

Service body: `title, slug?, shortDescription, intro, heroImageUrl, heroImageAlt, icon, features: string[], workflow: {title, description}[], faqs: {question, answer}[], isPublished, sortOrder, seoTitle?, seoDescription?`.

### Uploads
`POST /api/admin/uploads` — `multipart/form-data` with field `image`. JPEG, PNG, WebP or AVIF only, max `MAX_UPLOAD_MB`. The file signature is checked against the declared type. Returns `201 { data: { url: "/uploads/…", size, mimeType } }`.

### Enquiries (ADMIN+)
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/admin/enquiries` | Query: `status`, `search`, `page`, `pageSize` (default 20) |
| GET | `/api/admin/enquiries/export` | CSV download (optional `status`); cells are protected against spreadsheet formula injection |
| GET | `/api/admin/enquiries/:id` | Full enquiry with notes and linked project |
| PATCH | `/api/admin/enquiries/:id` | `{ status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" }` |
| POST | `/api/admin/enquiries/:id/notes` | `{ body }` → `201` |
| DELETE | `/api/admin/enquiries/:id` | `204`, notes cascade |

### Settings (ADMIN+)
`GET /api/admin/settings`, `PUT /api/admin/settings` with
`companyName, tagline, contactEmail?, phone?, whatsapp?, address?, officeHours?, socialLinks: { facebook?, instagram?, linkedin?, youtube?, x? }, logoUrl?, seoTitle?, seoDescription?, ogImageUrl?, maxEnquiriesPerEmail, maxEnquiriesPerPhone, enquiryLimitWindowDays`. The enquiry limits are admin-only and never exposed by the public `GET /api/settings`. Empty strings are stored as `null` and hidden on the website.
