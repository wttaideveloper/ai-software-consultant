# CLAUDE.md

Primary knowledge base for this repository. Read before making changes. Reflects the codebase as it exists today — not aspirational architecture.

---

## Project Overview

### Purpose

Automates the software-consulting discovery pipeline for consulting agencies. A consultant creates a **consultation** for a prospective client; the AI pipeline then progressively generates:

1. Consultation record (title, industry, project type, budget range, timeline)
2. Chat-based discovery conversation
3. Requirement summary (AI-generated markdown + structured JSON)
4. Detected features (AI-extracted from the summary; priority/complexity/confidence)
5. Feature matching (detected features ↔ a reusable feature-library catalog)
6. Project estimation (hours/weeks/team size/breakdown/risks)
7. Proposal (client-ready document)

### Business Domain

B2B SaaS for software consultancies. Multi-tenant: every entity is scoped to an `organization`. Users belong to one organization, have roles, and roles carry permissions (RBAC).

### Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express 5, TypeScript (NodeNext ESM), `tsx` for dev |
| Database | PostgreSQL (Neon), `pg` driver, Drizzle ORM + drizzle-kit migrations |
| Auth | `jsonwebtoken` (dual-secret access/refresh JWTs), `bcrypt` |
| AI | `openai` SDK, default model `gpt-4o-mini` (configurable via env) |
| Validation | Zod 4, both apps |
| Frontend | React 19, Vite 8, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 4, framer-motion, react-hook-form, axios, sonner, lucide-react |
| Lint | `oxlint` (frontend only — no backend linter) |
| Tests / CI | None configured — see Development Workflow |

### Architecture

Two-app monorepo, not a real workspace (root `package.json` has a single devDependency; `backend/` and `frontend/` are installed and run independently).

- **Backend**: modular monolith. Each domain is a vertical slice — route → controller → service → repository → validation → dto. No microservices, no queue, no job runner.
- **Frontend**: client-rendered SPA with two portals — a public **Client Portal** (`src/client-portal/`) for prospects, and a JWT-protected **Admin Portal** (`src/features/`) for consultants. Routing, layout, design system, auth flow, and API integration are all wired.
- **AI layer**: provider-agnostic — `AIOrchestrator → PromptService → AIService → AIProvider` — one provider implemented today (OpenAI).
- **Consultation Mode**: every consultation is one of four engagement types, and that value reshapes the whole pipeline (see its own section below). It is the first cross-cutting concern in the codebase — before adding mode-specific behaviour anywhere, read that section.

---

## Folder Structure

```
AI-Software-Consultant/
├── backend/
│   ├── drizzle/                     SQL migrations (0000–0008) + meta/ snapshots + _journal.json
│   ├── src/
│   │   ├── app.ts                   Composition root: express app, middleware, router mounting, DB ping, listen
│   │   ├── config/env.ts            process.env → typed EnvConfig (defaults, not validated)
│   │   ├── db/
│   │   │   ├── index.ts             pg Pool + Drizzle instance; Database/Transaction/DbExecutor types
│   │   │   ├── schema/               One file per table, enums.ts, helpers.ts, relations.ts, index.ts barrel
│   │   │   └── seeds/permissions.seed.ts
│   │   ├── middleware/               error-handler.ts, not-found.ts (mounted last in app.ts)
│   │   ├── modules/                  One folder per business domain (see Backend Architecture)
│   │   │   ├── admin/, consultation/, crm/, dashboard/   Empty .gitkeep scaffolds — not built
│   │   ├── shared/                   constants/, errors/app-error.ts, logger/, responses/api-response.ts
│   │   └── utils/async-handler.ts
│   ├── drizzle.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                     providers.tsx (QueryClient + Toaster), router.tsx
│   │   ├── components/
│   │   │   ├── ui/                  Design-system primitives + index.ts barrel
│   │   │   └── shared/page-header.tsx
│   │   ├── features/                One folder per route/page
│   │   ├── layouts/                 app-layout.tsx, navbar.tsx, sidebar.tsx, nav-config.ts
│   │   ├── hooks/use-media-query.ts
│   │   ├── services/api.ts          Axios instance — unwired scaffold (see Common Pitfalls)
│   │   ├── store/                   theme-store.ts (persisted), ui-store.ts (not persisted)
│   │   ├── styles/globals.css       Tailwind 4 theme, design tokens, custom gradient utilities
│   │   ├── types/index.ts
│   │   ├── utils/                   cn.ts, format.ts, motion.ts
│   │   ├── App.tsx, main.tsx
│   ├── public/
│   ├── dist/                        Build output — committed (see Common Pitfalls)
│   └── vite.config.ts               React + Tailwind plugins, `@` alias → src/
├── package.json                     Root — minimal, not a real workspace root
└── README.md
```

---

## Coding Standards

### TypeScript

- Backend is pure ESM (`NodeNext`). Relative imports need an explicit `.js` extension even though sources are `.ts` — e.g. `from "../../config/env.js"`. Required for the build to succeed.
- `strict: true` on both tsconfigs. Do not add `any` or `@ts-ignore` to silence an error — fix the type.
- Frontend (`tsconfig.app.json`) also enables `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` — unused imports/vars fail the build.
- Types are colocated per module: `*.dto.ts` (response shapes), `*.validation.ts` (Zod schemas + `z.infer` types), `*.repository.ts` (`typeof table.$inferSelect` record types).
- Prefer `type` over `interface`; the one exception (`AIProvider`) is intentionally an interface for structural implementation by provider classes.

### React

- Function components only.
- Form primitives (`Input`, `Textarea`, `Select`) use `forwardRef` and a shared `{ label?, hint?, error? }` contract.
- No React Context for app state — Zustand covers global state.
- Animation always goes through `framer-motion` using shared variants from `utils/motion.ts`, not ad-hoc transitions.
- `Modal`/`Drawer` render via `createPortal(document.body)` + `AnimatePresence`, with `Escape`-to-close.
- `oxlint` enforces `react/rules-of-hooks` as an error.

### Naming

- Files: kebab-case (`auth.service.ts`, `chat-page.tsx`).
- Backend module files always use the suffix set: `.route.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.validation.ts`, `.dto.ts`.
- Classes: PascalCase, always exported as both the class and a singleton instance — `export const authService = new AuthService();`.
- Constants: `SCREAMING_SNAKE_CASE` keys inside `as const` objects (`PERMISSIONS.USER_READ`), with a derived union type via `(typeof X)[keyof typeof X]`.
- React components: PascalCase, matching the file's primary export.
- `@/` (frontend only) resolves to `frontend/src/`.

### File organization

Backend: strict one-module-per-folder under `src/modules/<name>/` (see Backend Architecture → Modules). A module accesses another domain's tables directly through its own repository rather than importing another module's repository. Frontend: one folder per route under `src/features/<name>/`; shared UI in `components/ui/` (generic) or `components/shared/` (app-specific but cross-feature). Check `components/ui/index.ts` before adding a new primitive — it may already exist.

### Error handling

- Throw `AppError(message, HTTP_STATUS.X)` for any expected failure (validation, not-found, forbidden, conflict). Every controller action is wrapped in `asyncHandler(...)`, so thrown/rejected errors reach the global `errorHandler` automatically — never manually `try/catch` + `res.status().json()` in a controller.
- `errorHandler` returns the `AppError` message verbatim when `isOperational: true` (the default) and a generic `"Internal server error"` otherwise, logging the real message server-side. Never throw a raw `Error` for a user-facing failure — the message gets swallowed.
- Controllers validate with `zodSchema.safeParse(input)`; on failure, throw `AppError(parsed.error.issues[0]?.message ?? "Validation failed", HTTP_STATUS.BAD_REQUEST)`.
- Repository methods that hit an unexpected invariant (e.g. `.returning()` came back empty) throw a plain `Error` — these represent bugs/DB inconsistency, not user-facing conditions.
- AI-call failures are caught explicitly in services (not left to `asyncHandler`) so a failed `ai_generations` audit row can be written before re-throwing.
- Frontend: TanStack Query error state surfaced through Sonner toasts and the shared `SectionError` component (retry affordance for a failed panel). `utils/api-error.ts` normalizes axios failures into a display message.

---

## Frontend Architecture

### Components

Three tiers:
1. `components/ui/` — generic primitives: `Avatar, Badge, Button, Card/CardHeader/CardTitle/CardDescription, ConfirmDialog, Drawer, EmptyState, Input, Modal, Select, Skeleton/SkeletonCard, Spinner/PageLoader, Table/THead/TBody/TR/TH/TD, Tabs, Textarea`. Styled via `cn()` (`clsx` + `tailwind-merge`).
2. `components/shared/` — app-specific but cross-feature: `PageHeader` (title/description/actions row), `SectionError` (failed-panel retry), `PaginationControls`, `MarkdownViewer`, `ProcessingOverlay`, `SplitWorkspaceLayout`, `WorkspaceSection`, and `Timeline` (presentational vertical event list — callers build the `TimelineEvent[]`; used by both the Lead Details activity timeline and the dashboard's Recent Activity).
3. `features/<name>/` — page-level components composed from the above.

### Layouts

`AppLayout` is the single shell for every route: an animated `Sidebar` (width-collapses on desktop via `sidebarCollapsed`; renders inside a `Drawer` on mobile), a `Navbar`, and a `<main><Outlet /></main>` wrapped in `AnimatePresence`/`pageTransition`. Nav items are centralized in `nav-config.ts` (`APP_NAV_ITEMS`, `SECONDARY_NAV`) — add routes there, not by hardcoding links in `Sidebar`.

### Routing

`react-router-dom` v7, plain `<Routes>/<Route>` (no data router/loaders), declared in `router.tsx`. Three route trees: the **public Client Portal** (`/`, `/start`, `/requirements/*`, `/summary`, `/features`, `/estimate`, `/mockups`, `/request-proposal`, `/gift`) — `/start` is the Consultation Mode chooser and is where "Start Free AI Consultation" now lands, because the engagement type must be known before any question is asked, the **public auth route** behind `PublicRoute` (`/admin-login` only — there is no register page or route), and the **protected Admin Portal** behind `ProtectedRoute` → `AppLayout` (`/dashboard`, `/consultations`, …). Unmatched paths redirect to `/`.

### Forms & Validation

`react-hook-form` + `@hookform/resolvers` + `zod`, with per-feature schemas (`*.schema.ts`). Controls follow the `{ label, hint, error }` contract so `formState.errors` maps straight onto them — see Reusable UI patterns → Form fields for the shared `FieldShell` / `field-styles` composition.

### Styling

Tailwind CSS 4, CSS-first config (no `tailwind.config.js` — theme lives in `globals.css` via `@theme` and CSS custom properties for light/dark tokens). Dark mode is a `.dark` class on `<html>` toggled by `theme-store.ts`, not the media-query strategy. All conditional classes go through `cn()` — never string-concatenate.

**Never use Tailwind's native `bg-gradient-*` utilities for brand surfaces.** Use the custom `asc-gradient-accent` / `asc-gradient-subtle` / `asc-gradient-surface` classes defined in `globals.css` — the `asc-` prefix exists specifically to avoid colliding with Tailwind's own gradient utilities (documented inline in the file).

#### Design tokens

`globals.css` is the single source of truth. Style from tokens, not raw hex/px values:

- **Colour** — `bg-canvas`, `bg-surface`, `bg-surface-muted`, `bg-surface-sunken`, `text-foreground`, `text-foreground-soft`, `text-muted`, `border-border`, `border-border-strong`, plus semantic `accent` / `success` / `warning` / `danger` / `info` and their `-subtle` fills. Every text token is tuned to clear **WCAG AA** on its intended background — don't lighten `text-muted`.
- **`accent` vs `accent-text`** — `accent` is the fill/icon colour; `accent-text` is the variant for accent-coloured *text on a light surface*. Use `text-accent-text` for copy, `text-accent` for icons and fills.
- **Elevation** — Tailwind's `shadow-xs…shadow-2xl` are remapped onto a themed `--elev-*` ramp, so shadows stay correct in dark mode automatically. Never use `shadow-<color>` utilities (e.g. `shadow-accent/20`) — the ramp bakes its own colours in and the modifier won't apply. For a coloured glow use `asc-shadow-accent`.
- **Radius** — `rounded-lg` (controls), `rounded-xl` (small surfaces), `rounded-2xl` (cards, panels, modals, tables). Avoid arbitrary `rounded-[Npx]`.

**Custom classes that need Tailwind variants must be declared with `@utility`, not `@layer components`.** A component-layer class silently compiles to nothing when prefixed (`hover:asc-shadow-accent` produced no CSS until it moved to `@utility`). `asc-shadow-accent` and `asc-tabular` are `@utility`; the `asc-gradient-*`, `asc-glass`, `asc-raised` and `asc-skeleton` classes are component-layer and are only ever used unprefixed.

#### Motion

Shared easings and variants live in `utils/motion.ts` (`EASE_OUT_EXPO`, `SPRING_LAYOUT`, `SPRING_SNAPPY`, `fadeIn`, `pageTransition`, `staggerContainer`/`staggerItem`, `scrollReveal` + `SCROLL_VIEWPORT`, `popover`, `modalOverlay`/`modalPanel`, `drawerPanel`, `fieldError`, `stepTransition`). Import these rather than inlining a bezier.

Reduced motion is handled in **two** places, both required: the `prefers-reduced-motion` block in `globals.css` covers CSS animations/transitions, and `<MotionConfig reducedMotion="user">` in `providers.tsx` covers Framer Motion (which writes inline styles the media query cannot reach).

Animate `transform`/`opacity` only — they stay on the compositor. Any `layoutId` must be unique per mounted instance: `Tabs` and `Sidebar` both scope theirs (`useId()` and an `embedded` flag respectively) because two copies can be mounted at once.

### Reusable UI patterns

- **Placeholder shell**: every unwired feature page renders `PageHeader` + `EmptyState` (or a `Card` with a "not connected yet" description). This is the established scaffold for pages awaiting backend integration — replicate it for new pages rather than leaving a blank screen.
- **Card composition**: `<Card><CardHeader>…</CardHeader><CardTitle/><CardDescription/></Card>`, with `hover={false}` for static/dashboard cards. Passing `onClick` automatically upgrades the card to `role="button"` + Enter/Space handling.
- **Form fields**: `Input` / `Textarea` / `Select` / `PasswordInput` all compose `FieldShell` (`components/ui/field.tsx`) for their label/error/hint chrome and `fieldControlBase` / `fieldControlError` (`components/ui/field-styles.ts`) for control styling. Build new controls on those two rather than restyling from scratch — the styles live in a separate module so `field.tsx` stays component-only for Fast Refresh.
- **Confirm-before-destructive-action**: `ConfirmDialog` wraps `Modal` with `tone: "danger" | "primary"` — use it instead of a native `confirm()`.
- **Portal overlays**: `Modal`/`Drawer` both use `createPortal` + `AnimatePresence`, lock body scroll, and close on `Escape`; `Modal` also traps Tab and restores focus to the trigger. Follow this for new overlay components.
- **Accessibility baseline**: a global `:focus-visible` ring is defined in `globals.css`; custom interactive elements that override `outline` must re-add `focus-visible:outline-*`. Hover-revealed controls need `focus-within:opacity-100` so they stay keyboard-reachable. `AppLayout` renders a skip-to-content link targeting `#main-content`.

### Dashboard

`/dashboard` is a **sales** dashboard for the client-request workflow (Client Portal → Client Request → Lead Details → Proposal → Lead Status). Every widget reads `client_leads` through the existing `GET /api/client-leads`; there is no stats endpoint. The five KPI counts come from `?status=X&pageSize=1` → `meta.total` (one row per request, `countAll()` does the work), and "Total" plus Recent Requests plus Recent Activity all share one `pageSize=5` query via `useRecentClientRequests()`. It reuses the Client Requests feature's `useClientLeads` hook, so both screens share a cache.

The old consultation widgets (status totals, recent consultations, AI progress, Create Consultation, Open AI Chat) were removed with the discovery pipeline's demotion — don't reintroduce consultation data here. **Recent Activity shows lead-created events only** (see `dashboard-activity.ts`). That is now extendable: `audit_logs` gained its first writer with proposal versioning (`LEAD_PROPOSAL_VERSION_CREATED`), so proposal events can be folded into the feed by reading that table — no new storage needed.

### Cost Management (pricing engine)

`modules/cost/` turns effort into money. **The AI is never asked for a cost** — it returns hours, complexity and a breakdown; `cost.engine.ts` prices them from the organization's rate card, so pricing policy is data an admin owns rather than a number a model invents.

```
development = hours × hourlyRate × platformMultiplier
risk        = development × riskBuffer%
subtotal    = development + risk
discount    = capped by maxDiscount%      (a FIXED discount is capped too)
tax         = taxEnabled ? (subtotal − discount) × tax% : 0
finalPrice  = subtotal − discount + tax
```

- **`cost.engine.ts` is pure** — no DB, no AI, no clock. That is what makes the live preview and a real estimate provably the same calculation. Every published figure is rounded to 2dp so a breakdown's parts sum to its total.
- **There is no complexity multiplier, deliberately.** One used to sit between base cost and the platform premium; it was removed because it **double-counted complexity** — the AI already reflects difficulty in the hours it returns, so scaling those hours by a complexity tier charged for the same thing twice. Price now depends only on hours, rates, platforms, risk, discount and tax. Do not reintroduce one without first changing what the AI is asked to return.
- **Complexity survives as a label.** `AI_COMPLEXITY_TO_COST_LEVEL` still maps the model's LOW/MEDIUM/HIGH onto the four-tier vocabulary for `CostPreviewDto.complexityLevel`, estimate summaries and the frozen lead snapshot — display and reporting only, never money. ENTERPRISE remains unreachable from an AI signal.
- **`cost_complexity_multipliers` is deprecated dead data.** The table, its rows, `DEFAULT_COMPLEXITY_MULTIPLIERS`, and `GET|PATCH /api/complexity-multipliers` are all retained so configured values are not destroyed and no caller 404s — but nothing reads them, and the Admin UI has no editor. Drop them in a later, deliberate migration.
- **Multi-platform** uses additive premiums, `1 + Σ(multiplier − 1)`, not a product: a 1.0 platform adds nothing, more platforms always cost more, and three 1.4× platforms come to 2.2× rather than 2.74×.
- **Rate resolution**: explicit rate → the named role's rate → a blended mean of all roles (`rateBasis` says which was used). The AI returns total hours, not hours per discipline, so blended is the honest default.
- **Platform labels** (free text from leads/consultations) resolve through `PLATFORM_LABEL_ALIASES`; anything unrecognised is returned as `unpricedPlatforms` rather than silently priced as Web.
- **Defaults are provisioned lazily** on an organization's first read (`ensureDefaults`, `onConflictDoNothing` on every table) — a fresh install must not look broken because nobody ran a seed.
- **Estimation integration**: `estimation.service.ts` calls `costSettingsService.priceAiEstimate()` and returns `pricing` on the DTO. It is **derived at read time, not stored** — a rate-card change reprices open estimates, and freezing a price is the proposal's job. A pricing failure logs and yields `pricing: null` rather than breaking the estimate.
- **`techStack` is not priced and never was.** The ESTIMATION prompt returns it alongside effort, but it is routed to the technology engine (see Technology Stack), not the cost engine. Nothing about a recommended technology moves a number.
- **Client Portal integration**: `client-estimate.service.ts` prices its estimate through the same `priceAiEstimate()`. The portal is public and stateless, so it has no organization of its own — `client-estimate.repository.ts` resolves the platform owner (the earliest non-deleted org, the same single-tenant resolution `admin.seed.ts` uses) and prices against that rate card. Wizard platform labels feed the platform premium; a pricing failure yields `pricing: null` and the estimate still renders. The shared `ESTIMATION` prompt / `aiEstimationPayloadSchema` also carry an **optional `techStack`** (recommended technologies, never a price) — those are AI *additions only* now, merged onto the engine's baseline before they reach the DTO. See Technology Stack.
- **Interactive pricing (Client Portal)**: the estimate's Project Cost recalculates as the client toggles features. **The AI runs exactly once**, at generation; every toggle afterwards hits `POST /api/client/estimate/price` (public), which carries only hours + complexity + platforms back through the same `priceAiEstimate()`. Repricing client-side was rejected deliberately — price is not linear in hours once a discount cap or FIXED discount applies, so only the engine can answer. The AI returns one project total, not hours per feature, so `distributeFeatureHours()` (`client-portal/estimate/estimate-pricing.ts`) splits it across features by complexity weight using largest-remainder, guaranteeing the parts sum to the AI's total — otherwise "all included" would not equal the original and the summary would show phantom savings. The query key *is* the hour total, so toggling back is served from cache. Cost and timeline are shown as **ranges** (`PRICE_RANGE_SPREAD`, `TIMELINE_RANGE_WEEKS` in that same module), never a single exact figure.
- Permissions are `COST_SETTINGS_VIEW` / `COST_SETTINGS_EDIT`, separate from `SETTINGS_*`: seeing what a quote was built from and changing what the company charges are different privileges.

### Technology Stack (deterministic engine + AI enrichment)

`modules/tech-stack/` decides the recommended technology stack. **The AI is never asked to invent one** — the engine builds a deterministic baseline from what the project *is*, and the AI is only allowed to add to it. This mirrors Cost Management exactly: `tech-stack.engine.ts` is pure (no DB, no AI, no clock) for the same reason `cost.engine.ts` is, so the stack a client sees, the stack a proposal freezes and the stack a prompt is built from are provably the same calculation.

```
platforms + features + industry + projectType + hours/complexity
      ↓ analyzeProject()          { platforms, capabilities, industry, projectSize }
      ↓ buildBaselineFromAnalysis()   guaranteed TechStackGroup[]
      ↓ buildEnrichmentDirective()  → {{techStackBaseline}} in the ESTIMATION prompt
   AI returns techStack[]  (additions only)
      ↓ mergeTechStack(baseline, ai)   deduped, categorised, capped, ordered
```

- **The merge is one-directional.** The AI can only add — never remove, reorder or replace a baseline entry. That is what makes "a selected platform always reaches the stack" true regardless of what the model returns. `TECH_STACK_LIMITS` trims **AI additions only**; the baseline is never trimmed.
- **All catalogue data lives in `tech-stack.constants.ts`**, typed by `tech-stack.types.ts` (the two are split only to avoid a circular import — the constants file is a ~1,100-line catalogue indexed *by* those enums). Adding a technology for a platform, capability or industry is a one-line data edit and needs no code change. `Record<TechCapability, …>` typing means a new enum member is a compile error until the catalogue covers it.
- **`CONDITIONAL_TECHNOLOGIES` is OR-within-a-dimension, AND-across-dimensions.** `capabilities: ["AI", "SEARCH"]` fires on *either*, not both — this is a real trap: it once quoted pgvector to every project with a search box.
- **Deliberate defaults, each fixing a bad recommendation**: PostgreSQL + Drizzle (not MongoDB) is the core datastore; authentication is self-hosted JWT + bcrypt (not Firebase Auth / Auth0); push services (FCM/APNs) attach only when the NOTIFICATIONS capability is actually detected, never merely because a mobile platform was picked; each capability commits to **one** service rather than listing two or three interchangeable ones. Anything else is the AI's job to justify.
- **Keyword tables need whole-word discipline.** `detectPlatforms` skips aliases under 4 characters. Removed for false positives that reached real output: `tenant`/`tenants` from REAL_ESTATE (every multi-tenant SaaS matched), bare `tracking` from ANALYTICS ("order tracking" is a delivery feature).
- **`DEPLOYMENT` is labelled "Infrastructure"** — the *key* is kept because it is the value persisted inside grouped snapshots. `DEVOPS` and `TESTING` are separate categories: what a system runs on and how it ships are different claims to a client.
- **Wiring**: `client-estimate.service.ts` (full baseline → prompt → merge) and `estimation.service.ts` (baseline → prompt; the admin path still does not persist `techStack` — `project_estimations` has no column for it, so its enrichment is discarded as it always was).
- **Backward compatibility is by construction.** `normalizeTechStack()` reads the legacy flat `string[]`, the grouped form, or loose AI JSON, and every schema (`techStackInputSchema`) accepts either shape — so a lead or proposal version saved before the engine renders grouped with no migration and no backfill. The frontend mirror `types/tech-stack.ts` is **shape-only**: it wraps a legacy flat list into one unlabelled group and never guesses categories, because a second catalogue in the browser would drift from this one.
- **Presentation is `components/shared/tech-stack-groups.tsx`** on every surface (Client Portal estimate, admin lead workspace), with `TechStackField` for per-category editing in the proposal editor and grouped bullets in the PDF/DOCX export. Empty categories never render.
- `tech-stack-check.ts` at the backend root is a verification harness, excluded from `tsc`; run it with `npx tsx tech-stack-check.ts`.

### Concept mockups (Client Portal)

`modules/client-mockups/` renders 4–6 AI **concept screens** ("This is how I envision your project"). It is the only feature that generates images, and the only one that spends money per anonymous page view — every design decision below is a consequence of that.

It is **its own Client Portal step at `/mockups`** (`client-mockups-page.tsx`), sitting between Estimate and Proposal in `CLIENT_PORTAL_STEPS` — it is not part of the Estimate page. A batch therefore starts when the client continues past a finished estimate, never while they are reading one, so nothing billable is ever in flight behind the number they came for. The page owns the heading and the Regenerate control; `MockupGallery` is the body and, unlike when it lived under the estimate, never renders `null` — `DISABLED`, `NOT_APPLICABLE` (an engagement type that doesn't warrant concepts) and a rejected kick-off all resolve to a visible state rather than a blank route. **Continue is never gated on the concepts**: a slow, failed or switched-off batch must not block the proposal request.

- **Two AI stages, different models.** A cheap text call (`PROMPT_TYPES.CONCEPT_SCREENS`) *plans* the screens, returning `{name, description, imagePrompt}` per screen; the image model only *renders* one screen at a time. The image model is never asked what the screens should be — naming a coherent, domain-specific journey (Restaurant Details, not "Screen 3") is a reasoning task it does badly and cannot return as structured data. The planner's output is also what fills each card's name and description.
- **The planner designs the product before it names a screen, and `imagePrompt` is the only thing that carries any of it.** No other planner field reaches the image model, so `CONCEPT_SCREENS` runs a four-step method — business read (B2B/B2C, premium/playful, luxury/affordable), visual direction from an industry table (colour psychology, not chance), a full **DESIGN SYSTEM**, then the screens. The system is emitted as a compact delimited block precisely so it can be **copied character for character into every screen's `imagePrompt`**: each screen is a separate image call with no memory of the others, and a paraphrase drifts where a copied block does not. Motion and visual-language notes are deliberately excluded from the block — these are still images, and motion wording blurs a render.
- **`IMAGE_STYLE_DIRECTIVE` (`client-mockups.service.ts`) is the other half of that one prompt** and the two must be edited together — the literal string `DESIGN SYSTEM` is the cross-reference that makes the directive's "binding" clause resolve, so renaming it in one half breaks the other. It deliberately **names no colours of its own**, because a house palette there would make every project identical — exactly what its old "flat, modern, professional colour palette" line was doing. Framing leads the directive (the strongest slot, right after the screen description) since a cropped screen reads as broken rather than merely plain; for the same reason the word "full-bleed" is banned from both halves, as an image model reads it as *fill the canvas*.
- **Images are never stored as provider URLs.** `gpt-image-1` returns base64 and DALL·E URLs expire within the hour, so a persisted provider URL is a guaranteed broken image. Bytes go through the `MockupStorage` port (`shared/storage/`); the DB stores only an opaque `storageKey`. Swapping the filesystem adapter for S3/R2 is a new adapter plus one line in the factory — **no schema, DTO, or route change**. `client_mockup_images.storageKey` must stay opaque for that to hold.
- **`AIImageProvider` is a separate interface from `AIProvider`**, not extra methods on it, so a text-only provider stays a valid `AIProvider`. `OpenAIProvider` implements both.
- **The DB row is the job.** There is no queue here, so generation is a detached in-process promise and the client polls `GET /api/client/mockups/:key`. A `PENDING` row older than 10 minutes is treated as orphaned by a crash/redeploy and reclaimable — without that, one crash wedges a consultation on "Generating…" forever.
- **`NONE` vs `PENDING` is load-bearing.** `NONE` (nothing generated) is the *only* status that authorises the client to start a billable batch; `PENDING` means one is already running. Conflating them would let a poll mid-generation start a second batch. `FAILED` is user-retryable, never automatic, so a persistent fault cannot bill in a loop.
- **Spend controls, in order of durability**: the unique index on `consultation_key` + `onConflictDoNothing` (two concurrent POSTs → exactly one batch, holds across instances); `generation_count` enforced *inside the UPDATE predicate* (racing regenerate clicks can't both pass a stale read); a daily global batch budget in Postgres; and an in-memory per-IP window that is explicitly per-process and only the outermost, weakest layer.
- **`MOCKUPS_ENABLED` defaults to `false`.** Opt-in, not opt-out — a deployment that hasn't set a budget must not start billing because the code shipped. When off, `GET` returns `DISABLED` and the section renders nothing.
- **Caching identity is `consultationKey`**, a UUID minted client-side into the sessionStorage wizard state. The portal has no server-side consultation (see `client-leads.ts`), so this is the only thing that makes "generate once, never on refresh" possible without accounts. `reset()` mints a fresh one, so a new consultation never inherits the previous one's mockups.
- **Strictly downstream of the estimate.** Its own module, endpoint, table, query and now route; gated on a resolved estimate (no estimate → the page renders an EmptyState back to `/estimate` and spends nothing); never touches `client-estimate.*`, the cost engine, or proposal generation. A mockup failure degrades to a retry panel and nothing else.

### AI discovery questions (Client Portal)

`modules/client-requirements/` runs the wizard's AI interview. **The consultation length the client picks decides how many questions they get** — `CONSULTATION_TIME_QUESTION_COUNTS` in `client-requirements.constants.ts` (2 min → 5, 5 min → 9, 10 min → 13; unknown → 9; clamped by `MAX_QUESTIONS_HARD_CAP`).

- **The count is enforced in `nextQuestion()`, not just asked for in the prompt.** It used to live only as `{{questionGuidance}}` text with a single global ceiling in code, so a model that talked past its budget ran *every* interview to that ceiling and all three length options came out identical. Prompt guidance sets intent; the service is what actually stops the interview.
- **One exact figure per option, never a range** — the number is also the denominator of the portal's "AI Question X of N", and a range would make that a guess. The prompt is correspondingly instructed to ask all N and *not* to stop early.
- `frontend/src/client-portal/requirements-wizard/question-plan.ts` **mirrors** those counts, because the portal must show "1 of N" while question one is still in flight. The backend constants are the source of truth — **change one, change both**. The discovery endpoints' response shape (`{ question, completed }`) is deliberately untouched by this.
- Progress is derived from the transcript (`conversation.filter(role === "assistant").length`), so there is no counter to drift out of sync with the interview. `QuestionProgress` renders on that step only — the later single-screen steps have nothing to count through.

### Consultation Mode

Every consultation is one of four **engagement types**, and the choice reshapes the entire pipeline. `NEW_PROJECT` (build from scratch), `FEATURE_ENHANCEMENT` (add to a live app), `MAINTENANCE` (ongoing support), `MODERNIZATION` (upgrade/migrate). The platform previously assumed every consultation was a new build, so a client with a production system was asked for their business idea and target users — questions they have no answer to.

**`modules/prompts/consultation-mode.profiles.ts` is the single table every stage reads.** One `ConsultationModeProfile` per mode carries its discovery focus, feature categories, estimation directive, tech-stack directive, proposal title and mockup policy. `promptBuilder.injectConsultationModeContext()` expands the chosen mode into the `{{mode*}}` template variables, so **callers pass one enum value, never assembled wording**. Adding a fifth mode is one entry there plus one enum member.

- **Nothing else may branch on mode with its own `if`.** If a stage needs mode-specific behaviour, it belongs in that profile table. The two deliberate exceptions are code, not wording: `estimation.mode.ts` (which output shape is valid) and `client-mockups/mockup-policy.ts` (whether to spend money).
- **The vocabulary lives in `shared/constants/consultation-mode.ts`** — enum, `DEFAULT_CONSULTATION_MODE`, `normalizeConsultationMode()` (never throws) and `consultationModeSchema` (a `.default()`ed Zod enum, so a caller that omits the field is transparently NEW_PROJECT). The frontend mirror is `types/consultation-mode.ts`, which holds **only** what a browser needs to render the choice — labels, emoji, examples, wizard copy. Behaviour is never duplicated there.
- **`{{modeLabel}}`/`{{modeContext}}` reach six prompts**: both discovery prompts, `REQUIREMENT_SUMMARY`, `FEATURE_DETECTION`, `ESTIMATION`, `PROPOSAL` and `CONCEPT_SCREENS`.
- **The estimate's *shape* differs, not just its numbers.** `aiEstimationPayloadSchema` gained three mutually exclusive nullable blocks — `maintenancePlan`, `migrationPlan`, `enhancementImpact` — and `estimatedWeeks` is now **nullable**, because a support engagement has no delivery date and a number there would be fabricated. `estimation.mode.ts` (pure, shared by the admin pipeline and the Client Portal) re-imposes what Zod no longer can: weeks are *required* for the other three modes, the wrong-mode blocks are dropped, and a missing required block is rejected rather than invented.
- **Maintenance is quoted per month.** `monthlyPricing` runs `maintenancePlan.supportHoursPerMonth` through the same `priceAiEstimate()` — the AI still supplies only hours, the rate card still supplies the money.
- **Mockups are gated before anything billable.** `evaluateMockupEligibility()` runs on both `requestGeneration` and `regenerate` *before* a set is claimed, the budget is touched or the AI is called. NEW_PROJECT/FEATURE_ENHANCEMENT always generate; MAINTENANCE and MODERNIZATION only when the requirements actually ask for UI work. `NOT_APPLICABLE` is its own DTO status — deliberately not `NONE`, which would invite the client to start the batch the gate just declined.
  - **Weak UI terms need a nearby intent word.** A flat keyword match is not safe here: a maintenance interview asked whether outages were "impacting user experience", the phrase reached the summary, and a billable batch started for a client who wanted bug fixes. "improve the UI" is a request; "impacting user experience" is a symptom. Strong terms (`redesign`, `revamp`, `visual refresh`) still match alone.
- **Persistence**: `consultations.consultation_mode` and `client_leads.consultation_mode` (pgEnum, `NOT NULL DEFAULT 'NEW_PROJECT'`), plus `project_estimations.mode_plan` (jsonb — the three shapes are mutually exclusive and read as a unit, never queried on) and a now-nullable `project_estimations.estimated_weeks`. Migrations `0016` and `0017`.
- **Backwards compatibility is by construction, not by a backfill script**: the column defaults make every existing row a new-build consultation (which is what it was); every new AI field is optional; `normalizeConsultationMode()` absorbs anything unrecognised; and Zustand's persist merge keeps the initial value for a key an older session never stored.

### Discovery never asks about money or dates

**No discovery prompt may ask the client for a budget, cost, price, timeline, launch/delivery date, or project duration.** Discovery establishes *what* to build; the system derives *how long* (`estimation.service.ts` → `estimatedHours`/`estimatedWeeks`/`teamSize`) and *how much* (`cost.engine.ts` from the org's rate card). Asking the client to supply either invites them to anchor a number the consultancy is supposed to decide.

This is enforced in both discovery prompts in `prompt.builder.ts` — `CLIENT_REQUIREMENT_DISCOVERY` (Client Portal wizard) and `CONSULTATION` (admin chat) — which carry an explicit prohibition plus a "if the client volunteers a budget or a date, acknowledge and move on, never follow up" clause.

- **`{{budgetRange}}` and `{{timeline}}` are referenced by no template.** `injectConsultationContext` still populates them (they stay on `ConsultationPromptContext` and `RESERVED_TEMPLATE_VARIABLES` for compatibility), but an unreferenced variable never reaches the model, so nothing feeds a commercial figure into an AI call. Re-adding either placeholder to a template silently reintroduces the anchoring.
- **The consultation record keeps its `budgetRange`/`timeline` columns.** They are consultant-owned CRM fields set in the admin Consultation form — not something a client is asked. `chat.service.ts` deliberately omits them from the consultation context it passes to discovery.
- **`DiscoveryTopics` has no `timeline` or `budget` key** (`chat.dto.ts` / `chat.validation.ts` / `chat.service.ts`'s `GROUP_C_TOPICS`). A topic in that map is by definition something the AI may ask about, so a commercial topic must never be added back. `compliance` and `performance` replaced them in Group C, and `aiFeatures` joined Group B Tier 2. Their removal also stops `buildFinalAssumptions()` emitting "Assumed default approach for Budget/Timeline".
- **New topic keys are defaulted, not required, in `discoveryTopicsSchema`** (`newTopicSchema`). Assistant messages persisted before a key existed still parse out of `metadata.topics`, so an in-flight consultation keeps its Group A/B progress instead of resetting. Removed keys need no such handling — Zod strips unknown keys.
- `ESTIMATION` and `PROPOSAL` were cleaned of the same anchoring: estimation is told to derive effort purely from requirements, and the proposal is told to take its timeline from the supplied estimation and never refer to a client-given budget or date. Their JSON contracts are unchanged.

### Proposals

A client lead has **many proposal versions** (`lead_proposals`), not one draft, and **versions are never overwritten or lost**.

**Only DRAFT is mutable.** `PATCH /lead-proposals/:id` returns 409 for any other status — that server-side check, not the UI, is what makes history immutable. The editing rules:

| Status | Editing it does |
|---|---|
| DRAFT | edits in place, same version (Rule 1) |
| READY | forks a new DRAFT copy, reason `EDIT_READY` (Rule 2) |
| SENT / ACCEPTED / REJECTED / ARCHIVED | forks a new DRAFT copy, reason `EDIT_LOCKED` (Rule 3) |

`POST /lead-proposals/:id/edit` (`openForEditing`) applies those rules **server-side** and returns `{ proposal, created, source }`; the UI reads `created` to raise the "V6 is locked. A new Draft V7 has been created." toast. The client never picks the reason — it is derived from the real status, so no caller can mislabel a fork.

- **`writeVersion()` is the single writer** for the table. Manual create, Duplicate, both edit-forks, Regenerate and the localStorage import all funnel through it, so version numbering, the DRAFT default and the audit row can't diverge. `createNextVersionFromExisting(sourceId, reason, actor)` is the copy helper every automatic fork uses.
- **Regenerate** (`POST /lead-proposals/:id/regenerate`) always creates a new version — it never overwrites, whatever the source status.
- **Audit** goes to the existing `audit_logs` table (no new table): `action: LEAD_PROPOSAL_VERSION_CREATED`, `before` = source version, `after` = destination + reason. This is the first writer that table has ever had; a future activity feed (see the Dashboard note) should read from here.
- **Lead Details → Proposal Versions** shows Latest / Current Draft / Latest Sent / Latest Accepted; the **library** (`/proposals`) has two grains over the same filters — "All versions" and "By client" (Latest / Working Draft / Client Version) via `?groupBy=clients`. All of them are built by one `buildSummary()` in the service, so "working draft" and "client version" are defined exactly once.
- **Proposal Editor** (`/client-requests/:leadId/proposals/:proposalId`) edits **one version**, with the full **Proposal History** panel beside it. A locked version renders read-only via a single `<fieldset disabled>` wrapper — no editor component takes a `disabled` prop, so a newly added control cannot miss the rule. There is exactly one editor; do not fork it. Selecting a version in history only navigates — **browsing must never create a version**.
- **Version Compare** is not implemented. The architecture is ready for it: versions are immutable, the history panel already holds the full list and knows which is current, and `audit_logs` records what each fork came from.
- **Proposal status is independent of lead status.** Status moves through `PATCH /lead-proposals/:id/status` with a transition map in `lead-proposal.service.ts`, mirrored (for UI affordances only) in `lead-proposal-status.ts`. The server is the authority.
- New versions are prefilled by `buildProposalDraft(lead)` on the client and POSTed as `content`; the generator is deliberately not duplicated server-side.

### Navigation

Sidebar destinations are grouped in `layouts/nav-config.ts` as `APP_NAV_GROUPS` (Workspace / Discovery Pipeline / Manage). `APP_NAV_ITEMS` remains exported as a flat derived list. Add routes there, not by hardcoding links in `Sidebar`.

### Code splitting

`app/router.tsx` lazy-loads every route behind `React.lazy` + a single `<Suspense fallback={<PageLoader />}>`. Only `ClientLandingPage` and the two route guards are eager, since they're on the critical path for a first visit. Keep new routes lazy — the largest chunk is ~240 kB (75 kB gzip); it was 963 kB when everything shipped in one bundle.

---

## Backend Architecture

### Modules

Every domain under `src/modules/<name>/` follows the same five-file pattern:

```
<name>.route.ts        authenticate → authorize(PERMISSIONS.X) → controller method, per endpoint
<name>.controller.ts   asyncHandler-wrapped: parse req (Zod), call service, wrap response in successResponse()
<name>.service.ts      Business logic; calls repository + aiOrchestrator where relevant; throws AppError
<name>.repository.ts   Drizzle queries; org-scoped methods take (id, organizationId, executor = db)
<name>.dto.ts          Response types + a toXDto() mapper (the mapper itself lives in the service file)
<name>.validation.ts   Zod schemas (params/query/body) + inferred input types
```

Modules: `auth`, `users`, `consultations`, `conversations`, `chat`, `requirement-summary`, `feature-detection`, `estimation`, `proposal`, `feature-library`, `client-lead`, `lead-proposal`, `cost`, `settings`, the `client-*` Client Portal modules, plus non-domain `ai/` (provider abstraction), `prompts/` (templating, and the Consultation Mode profile registry) and `tech-stack/` (the pure recommendation engine — data + engine only, no route/controller/service; see its own section). Empty scaffolds (`.gitkeep` only): `admin`, `crm`, `dashboard`.

**Two proposal modules exist and are not the same thing.** `proposal/` is the consultation-based AI proposal (`project_proposals`, generated by the AI pipeline) — untouched and still routed. `lead-proposal/` is the versioned sales proposal for a client lead (`lead_proposals`) and involves no AI call: versions are prefilled client-side by `buildProposalDraft()` from the lead's summary, features and estimate.

### Services

Own all business rules: existence checks (404), state-transition checks (e.g. a `completed` consultation can't be edited), cross-entity invariants (e.g. `assignedTo` must be a user in the same organization), and transactions (`repository.runInTransaction(async (tx) => {...})`) for multi-table writes.

The six AI-generating services (`chat`, `feature-detection`, `estimation`, `proposal`, `requirement-summary`, `feature-library`'s matching) share one shape:
1. Look up prerequisite records (consultation, org, upstream AI artifact); 404/400 if missing.
2. Call `aiOrchestrator.generateConversationReply({ promptType, organization, consultation, conversationHistory, userMessage })`.
3. On failure, persist a `status: "failed"` `ai_generations` row and re-throw.
4. Parse the AI's JSON response (`extractJsonPayload()` + a Zod `ai*PayloadSchema`); on failure, persist a failed row and throw `AppError(500)`.
5. Persist the result (versioned for summary/estimation/proposal — see Database) and a `status: "success"` row, in one transaction.

`extractJsonPayload` (try `JSON.parse` → strip ```` ```json ```` fences → fall back to first-`{`/last-`}` slicing) is duplicated verbatim in all five services — see Common Pitfalls before changing it.

### Controllers

Thin HTTP adapters: `safeParse` params/query/body → `AppError(400)` on failure → call one service method → `successResponse(message, data)`. Never touch Drizzle directly.

### Middleware

- `authenticate` — extracts the `Bearer` token, verifies it's specifically an **access** token, re-fetches the user from DB on every request, attaches `req.user`, 401s if missing/inactive.
- `authorize(...permissionCodes)` — runs after `authenticate`; loads the user's permission codes fresh from DB, 403s if any required code is missing.
- `asyncHandler` — wraps every async route handler.
- `errorHandler` / `notFound` — mounted last in `app.ts`, global.

### Authentication

JWTs signed with **separate secrets** (`JWT_SECRET` / `JWT_REFRESH_SECRET`) and a `type: "access" | "refresh"` claim checked on verify, so a token can't be used as the wrong kind.

- **Register**: **disabled — the route is not mounted.** This is an internal platform with no self-service signup. `authController.register` / `authService.register` / `registerSchema` are all intentionally kept intact and reachable in code (`admin.seed.ts` reuses `registerSchema` for its password policy); only the `authRouter.post("/register", …)` line is gone, and re-adding it is the whole opt-in. The implementation, if re-enabled: one transaction — create org (slug uniquified), create user (bcrypt, `BCRYPT_SALT_ROUNDS = 12`), bootstrap an "Admin" role with every permission if the org has no roles yet, assign it, seed default org/user settings, issue + store tokens.
- **Account provisioning** replaces it: the first admin comes from `db/seeds/admin.seed.ts` (`ensureDefaultAdmin()`, run on every boot from `app.ts` and via `npm run db:seed:admin`); further staff accounts come from the authenticated `POST /api/users`. The seed is idempotent on `DEFAULT_ADMIN_EMAIL` — if a non-deleted user holds that address it does nothing, never rewriting a password or re-granting a role. With `DEFAULT_ADMIN_EMAIL`/`DEFAULT_ADMIN_PASSWORD` unset it creates nothing and warns; there is deliberately no fallback credential in code.
- **There is no "Super Admin" role.** Roles are org-scoped; the full-permission role both registration and the admin seed use is `slug: "admin"` (`isSystem: true`, every permission granted). `permissions.seed.ts` tops up every role with that slug.
- **Login**: verify email/password/status → update `lastLoginAt` → delete all of the user's existing refresh tokens → store a new one (SHA-256 hash, never the raw token). One valid refresh token per user at a time.
- `GET /auth/me` returns the current user + organization.
- **Refresh**: `POST /api/auth/refresh` exchanges a refresh token for a **new pair**. Deliberately unauthenticated — the caller arrives precisely because its access token expired, so requiring one would be circular. It verifies the JWT, then requires the SHA-256 hash to still match a stored row (signature alone is not enough — that DB check is what makes "newer login wins" and rotation actually bite), checks not revoked/expired and that the user is still active, then **rotates**: the old token is deleted and a replacement issued in the same transaction. So a refresh token is **single-use** — replaying one after the real client has refreshed is rejected. Every failure mode returns the same flat 401; the client's correct reaction to all of them is identical, and distinguishing them only helps someone probing.
- **There is still no `/auth/logout` endpoint.** Logging out clears client state only; the stored refresh-token row survives until the next login (which deletes all of the user's tokens) or its 7-day expiry.
- **Session lifetime is 15m access / 7d refresh** (`ACCESS_TOKEN_EXPIRES` / `REFRESH_TOKEN_EXPIRES`). The frontend renews silently, so the effective session is the refresh window, not 15 minutes — see State Management → Session renewal.

### Authorization

RBAC: `users —(user_roles)— roles —(role_permissions)— permissions`. `authorizationService.assertHasPermissions(userId, required)` loads the user's roles, resolves distinct permission codes, and checks all required codes are present. Codes are cataloged in `permissions.constants.ts` (`PERMISSIONS`, `SYSTEM_PERMISSION_DEFINITIONS`), seeded via `db:seed:permissions`.

### API structure

Base prefix: **`/api`** (`API_PREFIX` in `shared/constants/app.ts` — no `/v1`). Mounted in `app.ts`:

```
GET  /api/health                                          no auth
POST /api/auth/login                                       (no /register — not mounted)
POST /api/auth/refresh                                     no auth; rotates the pair, single-use
GET  /api/auth/me                                          authenticate

GET|POST    /api/users, /api/users/:id                     authorize(USER_*)
GET|POST    /api/consultations, /api/consultations/:id     authorize(CONSULTATION_*)

# Nested under a consultation (mergeParams routers):
GET|POST    /api/consultations/:consultationId/messages
POST        /api/consultations/:consultationId/chat
GET|POST    /api/consultations/:consultationId/requirement-summary
GET|POST    /api/consultations/:consultationId/features
GET|POST    /api/consultations/:consultationId/estimate
GET|POST    /api/consultations/:consultationId/proposal

PATCH|DELETE /api/messages/:id
GET|POST     /api/feature-library, /api/feature-library/:id
POST         /api/features/match

# Cost Management — the pricing engine (authorize(COST_SETTINGS_VIEW|EDIT)):
GET|PATCH    /api/cost-settings                           risk, currency, tax, discount rules
GET          /api/cost-settings/preview                    live calculator; calculates, persists nothing
GET|PATCH    /api/hourly-rates                             per-role rates (batch save)
GET|PATCH    /api/complexity-multipliers                   DEPRECATED — no pricing effect
GET|PATCH    /api/platform-multipliers                     per-platform multipliers (batch save)

# Lead proposals — versioned proposals for a client lead (authorize(PROPOSAL_*)):
GET|POST     /api/client-leads/:leadId/proposals         list versions (+summary) / create version
GET          /api/lead-proposals                          library: search, status, leadId, sortBy, sortDir, groupBy
GET|PATCH    /api/lead-proposals/:id                      full version / edit body — DRAFT only, else 409
POST         /api/lead-proposals/:id/edit                 applies the editing rules; may fork a new draft
POST         /api/lead-proposals/:id/regenerate           always a new version, never an overwrite
PATCH        /api/lead-proposals/:id/status               Mark Ready|Sent|Accepted|Rejected|Archive
DELETE       /api/lead-proposals/:id                      drafts only, soft delete
```

Every response: `{ success, message, data | errors, timestamp }` (`successResponse`/`errorResponse`). Every list endpoint: `{ items, meta: { page, pageSize, total, totalPages } }` — see Project Conventions for the shared query-schema shape.

---

## State Management

### Global

Zustand. Each persisted store owns exactly one storage key and never clears another's:

| Store | Key | Storage | Notes |
|---|---|---|---|
| `store/theme-store.ts` | `asc-theme` | localStorage | `initializeTheme()` runs once in `main.tsx` before render to avoid a theme flash, falling back to `prefers-color-scheme`. |
| `store/auth-store.ts` | `asc-auth` | local **or** session | "Remember me" picks the storage via `setAuthStoragePreference()`; the custom `dualStorage` writes one and removes the other. Persists **both** tokens — the refresh token is what keeps a session alive past 15 minutes, so dropping it from `partialize` silently reintroduces the hard logout. |
| `store/client-consultation.store.ts` | `asc-client-consultation` | **sessionStorage** | Client Portal wizard state. Session-scoped on purpose: a refresh mid-consultation must not lose answers, but closing the browser must not resurrect the project on the next visit. Cleared outright by `clearClientConsultation()` on lead submit and on "start a new consultation" (`client-portal/hooks/use-start-new-consultation.ts`). Also holds `consultationKey`, the UUID that identifies this visit to the server — it is the concept-mockup cache key, and `reset()` deliberately mints a fresh one. |
| `features/proposal-editor/proposal-draft.store.ts` | `asc-proposal-drafts` | localStorage | **Deprecated, read-only.** Proposals now live in `lead_proposals`. Retained solely so `use-migrate-local-draft.ts` can promote a pre-existing browser draft to Version 1 and then clear it. Nothing writes it. |

`store/ui-store.ts` (sidebar/drawer flags) is not persisted. Never call `localStorage.clear()` — remove the specific key.

### Local

Plain `useState`/`useEffect`/`useRef` for component-local concerns (e.g. `Navbar`'s profile-menu outside-click handling).

### Data fetching & caching

TanStack Query is configured in `providers.tsx` (`retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 30_000`). `services/*.service.ts` holds the axios calls; per-feature `hooks/use-*.ts` wrap them in `useQuery`/`useMutation`.

### Session renewal

`services/api.ts` owns the whole token lifecycle, so no feature hook ever thinks about expiry:

- A **request** interceptor attaches the current access token.
- A **response** interceptor turns a 401 into a silent recovery: refresh once, then replay the original request. It only does so for a request that still has a session, hasn't already been replayed (`_retried`), isn't `/auth/login` (a 401 there is bad credentials) and isn't `/auth/refresh` itself. Anything else — or a failed refresh — falls through to `clearSession()` + toast + redirect to `/admin-login`, which is the pre-existing behaviour.
- **The refresh is single-flight.** Concurrent 401s all await one shared `refreshPromise`. This is not an optimisation: the server rotates the refresh token on every use, so N parallel refreshes would invalidate each other and log the user out. Keep it that way.
- The refresh call uses **bare `axios`, not the `api` instance** — routing it through `api` would re-enter this interceptor and recurse when a refresh fails.
- The rotated refresh token is written back via `setTokens()`; failing to store it breaks the *next* renewal, not the current one, so the bug would surface 15 minutes later.

**A caveat when reasoning about "auto-logout" reports:** sessions persisted before refresh-token storage shipped have no `refreshToken`, so the first 401 logs them out once; logging in again fixes it permanently.

---

## Database

### ORM

Drizzle ORM (`drizzle-orm/node-postgres`) over a `pg.Pool`. `db/index.ts` exports `db`, `pool`, and `Database`/`Transaction`/`DbExecutor` (`Database | Transaction`) types. Every repository method's last parameter is `executor: DbExecutor = db`, so the same method runs standalone or inside `db.transaction()`.

### Schema organization

One file per table under `db/schema/`, re-exported via `schema/index.ts`: `enums.ts` (all `pgEnum`s), `helpers.ts` (shared `createdAt`/`updatedAt`/`deletedAt` column builders), `relations.ts` (all `relations()` definitions, not colocated with tables), and one file per table (`organizations, users, roles, permissions, role-permissions, user-roles, refresh-tokens, verification-tokens, organization-settings, user-settings, audit-logs, consultations, conversation-messages, ai-generations, requirement-summaries, detected-features, project-estimations, project-proposals, feature-library`).

### Relationships

`organizations` is the tenant root. `users` belong to one organization. RBAC: `users —(user_roles)— roles —(role_permissions)— permissions` (`roles.organizationId` is nullable, though every role created today is org-scoped). `consultations` belong to an organization and reference `createdBy`/`assignedTo` users. Everything downstream of a consultation cascades on both `organizationId` and `consultationId` (`onDelete: "cascade"`). `requirement_summaries`, `project_estimations`, and `project_proposals` each have a **unique index on `consultationId`** — one row per consultation, updated in place with an incrementing `version` and `generatedBy: "AI" | "USER"` rather than inserting a new row per regeneration. `feature_library` is org-scoped but consultation-independent.

`lead_proposals` is the versioned proposal store for a client lead: many rows per `client_leads` row (cascade on delete), `createdBy → users` nullable with `onDelete: "set null"` so history survives a user deletion, and a **unique index on `(lead_id, version_number)`** — that index, not application code, is what stops two concurrent "Create New Version" clicks both claiming V3. Version numbers are never reused, including after a draft is deleted. Like `client_leads` it carries no `organizationId`.

Soft delete (`deletedAt`) applies to `organizations, users, consultations, conversation_messages, requirement_summaries, detected_features, project_estimations, project_proposals, feature_library, lead_proposals` — every read on these filters `isNull(deletedAt)`.

### Migrations

drizzle-kit (`drizzle.config.ts`: schema glob `./src/db/schema/*`, output `./drizzle`, `dialect: "postgresql"`). Numbered SQL files under `backend/drizzle/` (`0000_foundation.sql` … `0014_flippant_meltdown.sql`) with matching snapshots in `drizzle/meta/` and `_journal.json`. `backend/package.json` has **no `db:migrate`/`db:generate` script** — run the `drizzle-kit` CLI directly (`npx drizzle-kit generate`, `npx drizzle-kit migrate`).

---

## Development Workflow

### Backend (`backend/`)

```
npm run dev                  tsx watch src/app.ts       dev server, hot reload, PORT env (default 5000)
npm run build                tsc                        type-check + emit to dist/
npm run start                node dist/app.js
npm run db:seed:permissions  tsx src/db/seeds/permissions.seed.ts
npm run db:seed:admin        tsx src/db/seeds/admin.seed.ts        idempotent bootstrap admin; also runs on every boot
```

### Frontend (`frontend/`)

```
npm run dev        vite                    dev server on :5173
npm run build       tsc -b && vite build    project-reference type check, then build
npm run lint        oxlint
npm run preview     vite preview
```

### Lint / type check / tests

- Lint: frontend only, `oxlint` (`.oxlintrc.json`: `react/rules-of-hooks` = error, `react/only-export-components` = warn). Backend has no linter — rely on `tsc`.
- Type check: there is no standalone `tsc --noEmit` script on either side — `npm run build` **is** the type-check gate for both apps. Run it after non-trivial changes.
- Tests: **no test framework is installed anywhere** (no vitest/jest/playwright, no `*.test.*`/`*.spec.*` files, no test script in either `package.json`). No CI (no `.github/workflows`) and no git hooks (no husky). Don't assume test coverage exists; adding a framework is a decision to raise with the user, not something to introduce as a side effect.

---

## Project Conventions

- **Singleton exports**: every class-based module exports both the class and an instance — `export const authService = new AuthService();`. Callers import the instance; only the AI layer is constructor-injected (`new AIService(openAIProvider)`).
- **Pagination contract**: every list query schema is `{ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE), search?: ... }` (constants from `shared/constants/app.ts`); response is always `{ items, meta: { page, pageSize, total, totalPages } }`.
- **Partial-update schemas require ≥1 field**: every `update*Schema` ends with `.refine(v => Object.keys(v).length > 0, "At least one field must be provided")`.
- **AI generations are always audited**: every AI call site inserts an `ai_generations` row on both success and failure — never skipped. `estimatedCost` is currently always persisted as `"0"` (token counts are captured, cost is never computed from them).
- **Prompt templates** are centralized in `prompt.builder.ts` as `{{variable}}`-interpolated strings keyed by `PROMPT_TYPES`. Non-conversational AI calls instruct the model to return "ONLY valid JSON (no markdown fences)" in a documented exact shape — follow this pattern for new AI features.

---

## Common Pitfalls

1. **Backend imports need explicit `.js` extensions** (NodeNext ESM) — omitting it breaks the build even though the source is `.ts`.
2. **`API_PREFIX` is `/api`** — there is no `/v1` segment; don't assume API versioning.
3. **`backend/.env` is gitignored and untracked** (root `.gitignore` covers `backend/.env`, `backend/dist/`, `.env`) — it holds the real `DATABASE_URL`, JWT secrets, `OPENAI_API_KEY` and `DEFAULT_ADMIN_PASSWORD`. `backend/.env.example` is the tracked, value-free counterpart: add new keys there, never real secrets.
4. **`node_modules/` (both apps) and `frontend/dist/` are committed.** A broad `git add -A`/`git add .` will re-stage huge trees — always stage specific files.
5. **JWT secrets aren't validated at boot.** `config/env.ts` defaults `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_URL` to `""` instead of throwing — a blank `.env` value won't be caught, it'll silently sign tokens with an empty key.
6. **The five `extractJsonPayload` implementations are duplicated verbatim** across `feature-detection`, `estimation`, `proposal`, `requirement-summary`, `feature-library` services. A bugfix in one likely needs applying to all five.
7. **Tailwind v4 variants don't apply to `@layer components` classes.** `hover:my-custom-class` silently emits no CSS. Declare anything that needs a variant with `@utility` (see Frontend → Styling).
8. **Don't combine Tailwind `shadow-<color>` modifiers with the shadow scale.** `--shadow-*` is remapped onto the themed `--elev-*` ramp with colours baked in, so `shadow-accent/20` is ignored. Use `asc-shadow-accent`.
9. **`layoutId` must be unique per mounted instance.** `Sidebar` mounts twice (desktop rail + mobile drawer) and `Tabs` can appear more than once per page — both scope their `layoutId`, and new shared-layout animations must too.
10. **Backend `typescript@^7.0.2` vs. frontend `~6.0.2`** — don't assume identical behavior when touching build/tooling config across the two apps.

---

## AI Development Instructions

- Read this file before making changes. If something here conflicts with the code, trust the code and update this file.
- Follow the architecture and conventions documented above rather than introducing a new pattern for a single feature.
- Search `shared/`, `modules/*/`, `components/ui/index.ts`, and `utils/` for an existing utility or component before writing a new one.
- Never duplicate a utility or business-logic pattern. If something already exists in two places due to known duplication (e.g. `extractJsonPayload`, Common Pitfalls #6), consolidating is preferred over adding a third copy — but confirm before refactoring code outside the task's scope.
- Prefer extending existing modules (auth, org scoping, AI orchestration) over building a parallel implementation.
- For anything touching more than one module, a schema change, or a new dependency: explain the plan before writing code.
- Keep changes minimal and scoped to what was asked — no unrelated refactors, even to fix a known issue from Common Pitfalls (flag it instead).
- Preserve TypeScript strictness — no `any`, no `@ts-ignore`, no loosening `tsconfig` options.
- Preserve responsive behavior — check both the mobile drawer and desktop sidebar layouts for any layout change.
- Maintain backward compatibility (API shapes, DTO fields, route paths) unless a breaking change is explicitly requested.
- Run `npm run build` in the relevant app after non-trivial changes — it's the only type-check gate that exists.
- Run `npm run lint` (`oxlint`) in `frontend/` for frontend changes and fix anything you introduce; there's no backend lint command.
- Update this file when the architecture or workflow changes — new modules, resolved pitfalls (e.g. a `/auth/refresh` endpoint ships, or the frontend gets wired to the API), so it keeps matching reality.
