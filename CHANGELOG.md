# WeLoan365 Admin — Prototype Changelog

> **Purpose:** a single place to track every feature, functionality, and business-logic
> change shipped to this prototype — versioned, dated, and tied back to commits — so
> anyone picking up development work can see what changed and *why* without digging
> through raw git history.
>
> **Audience:** developers (hand-off / onboarding), PM and design reviewers checking
> what shipped.
>
> Note: this is independent of the demo `CURRENT_VERSION` / `LATEST_VERSION` constants
> in `components/app-version.tsx` — those are mock data for the in-app "update available"
> UI, not a real version tracker.

## Versioning rules

This log uses semantic versioning (`MAJOR.MINOR.PATCH`):

- **MINOR** (`0.X.0`) — a new feature, screen, or business rule was added.
- **PATCH** (`0.X.Y`) — an existing feature was fixed, refined, or corrected (no new rule).
- **MAJOR** (`X.0.0`) — reserved for a full re-architecture or product-scope change. Not used yet.

**Every time a feature or function is added, changed, or improved, bump the version and
add an entry below** (newest on top). One entry per shipped batch of work is fine — it
doesn't need to be one entry per commit.

> Entries from `v0.1.0` through `v0.6.0` (2026-06-11 → 2026-07-11) are reconstructed from
> git history to establish this baseline — they predate this changelog and are
> best-effort summaries from the diffs, not first-hand notes from whoever built them.

---

## v0.11.0 — 2026-07-20
**Real post/promotion scheduling; App Mascot library reorganized into Screen/Sheet/Label**

- Commits: `38787ce`

**Business logic:**
- Blog Posts, CSR Activity, and Promotions all gained a real **"Schedule post"** toggle
  in their New/Edit forms. Off (default) publishes immediately. On reveals a date
  picker — picking a **future** date sets the record's status to `Scheduled` with that
  date; otherwise it publishes immediately as `Published`. This replaces the old
  `Scheduled`/`Draft` fields that existed in seed data but had no working UI behind them.
- Promotion status vocabulary changed from `Active`/`Inactive` to
  `Published`/`Scheduled`/`Failed`, aligning it with Posts so all three content types
  share one mental model.
- Added a `Failed` status (mockup only, no live failure path yet) so the status column
  can demonstrate all three states across Blog Posts, CSR, and Promotions.
- Removed the `Author` field entirely from the Blog Posts editor (CSR had already lost
  it in an earlier pass) — author is no longer shown or collected anywhere in Media.
- **App Mascot** (Settings) reorganized from one flat grid into three labeled sections:
  - **Screen** — one card per full customer-app screen (Splash, Welcome, Sign Up, Staff
    KYC, Sign In/Up Success, Guarantor Waiting/Received/SMS Confirm, My Loan In
    Progress/Empty/Loan Detail/Reject, MWL Confirm Contract, Disbursements, FAQ,
    Success, Paid Off, Request — 17 total).
  - **Sheet** — bottom-sheet-style illustrations (Birthday, No Internet).
  - **Label** — small inline icons for specific UI elements (Apply New Loan, My Loan
    Advance card, MWL Contract, Loan Detail Paid Off button/label, Restructure, and the
    "More" menu row icons: About Us, CSR, Branch, Calculator, CBC, Consultation,
    Complaints — 13 total).
- Removed the "Delete mascot" action and the "Default" badge from mascot cards — this
  set is now a fixed, non-deletable library for this prototype phase.

**Files touched:** `lib/data.ts`, `components/posts-manager.tsx`,
`app/content/promotions/page.tsx`, `components/settings-modal.tsx`

---

## v0.10.0 — 2026-07-17
**App Mascot management added to Settings**

- Commits: `85a8cde`

**Business logic:**
- New Settings section to manage the mascot illustrations shown to customers in the
  mobile app — upload / replace / remove an image per screen.
- A "Where it's used" panel cross-references which customer-app flow screens (MWL /
  Non-MWL) currently have their mascot toggle turned on in Apply Loan Setting, so an
  admin can see the effect of the default illustration without leaving the page.

**Files touched:** `components/settings-modal.tsx`

---

## v0.9.1 — 2026-07-16 (patch)
**Fix Vercel build failure on Consultations**

- Commits: `ccf0f78`

**Business logic:** none — deploy-blocking bug fix only. `useSearchParams()` requires a
Suspense boundary for Next.js static export; the page was split into a thin wrapper
around a `<Suspense>`-wrapped inner component. No behavior change.

**Files touched:** `app/customer/consultations/page.tsx`

---

## v0.9.0 — 2026-07-16
**CSR Activity split out; Notifications system; Consultations search/filter**

- Commits: `68d8d6f`

**Business logic:**
- **CSR Activity** became its own top-level nav item and route (`/content/csr`),
  separate from Blog Posts, though both share one editor component. CSR posts use
  CSR-only fields (quotation, location) and CSR-specific categories (Community
  Welfare, Public Service) instead of Blog's media categories (Blog, News, Tips, Edu).
- **Notifications**: new bell icon + dropdown in the topbar. Each notification
  deep-links to the real record it describes (a consultation, application, account,
  etc.) — clicking one navigates straight to that record and marks it read, rather
  than just displaying informational text.
- **Consultations**: added search and officer/status filtering to the list.

**Files touched:** `app/content/csr/page.tsx`, `app/content/posts/page.tsx`,
`components/posts-manager.tsx` (new, shared editor), `lib/notifications.tsx` (new),
`components/topbar.tsx`, `app/customer/consultations/page.tsx`,
`app/customer/feedback/page.tsx`

---

## v0.8.0 — 2026-07-15
**Customer referral program; MWL/Staff application-flow settings**

- Commits: `eb8463d`, `9685918`

**Business logic:**
- **Referral program**: staff can be issued a 5-digit referral code; codes drive
  per-staff referral-stats tracking, surfaced in an expanded customer Account detail
  profile view.
- **Apply Loan Setting** extended so the **Migrant Worker Loan (MWL)** and **Staff
  Loan** flows can each be configured with their own required steps/screens
  independently of the generic (Non-MWL) flow — previously one setting applied to all
  loan types.

**Files touched:** `app/customer/accounts/[id]/page.tsx`, `lib/utils.ts`,
`components/settings-modal.tsx`, `lib/data.ts`

---

## v0.7.0 — 2026-07-13
**Per-loan-type application detail views**

- Commits: `3908100`, `c30ef75`

**Business logic:**
- The Loan Application detail page now branches its data and layout by loan **product
  type** — MWL, Staff, and Non-MWL applications each surface the fields relevant to
  that type (e.g. MWL shows overseas destination country and guarantor-confirmation
  state) instead of one generic layout serving every loan type.

**Files touched:** `app/customer/applications/[id]/page.tsx`, `lib/data.ts`,
`app/loan-product/page.tsx`

---

## v0.6.0 — 2026-07-11
**Loan Product table: drag-to-reorder, collapsible MWL destinations**

- Commits: `64d6a00`, `a916523`

**Business logic:**
- Loan products can be **drag-reordered** in the table; a confirmation toast reports
  the old → new position and stays open until dismissed (matches the rest of the
  app's modal behavior instead of auto-disappearing).
- MWL destination-country sub-rows (Korea, Japan, Singapore, etc.) **collapse under
  their parent product** by default, with a chevron to expand — keeps the table
  scannable as more destination countries are added.

**Files touched:** `app/loan-product/page.tsx`, `lib/data.ts`

---

## v0.5.0 — 2026-06-16
**Consultations overhaul; new Customer Feedback/Complaint page**

- Commits: `5d75bb6`

**Business logic:**
- Consultations page substantially reworked (~600 lines).
- New **Customer Feedback / Complaint** page: staff can reply to submitted feedback.
  The **first reply stays editable**; editing an already-sent reply a second time
  **finalizes (locks) it** — a one-edit-then-locked rule enforced via a shared
  `feedback-store`.
- Dashboard gained quick-links; Profile and Account Settings pages expanded.

**Files touched:** `app/customer/consultations/page.tsx`,
`app/customer/feedback/page.tsx` (new), `lib/feedback-store.ts` (new),
`components/dashboard-quick-links.tsx` (new), `app/profile/page.tsx`,
`app/account-settings/page.tsx`

---

## v0.4.0 — 2026-06-15
**Role-based sign-in with real permission sets**

- Commits: `0853eb7`, `8a8c784`

**Business logic:**
- The login screen's **"Sign in as"** role picker (Admin / Senior Officer / Credit
  Officer / Customer Service) now applies that role's **actual permission set** —
  each option shows a live `X/33 permissions` count pulled from `PERMISSIONS`/`ROLES`
  in `lib/data.ts`, not placeholder text.
- The chosen role is persisted to `localStorage` (`setActiveRole` / `role-context.tsx`)
  so the whole app — including gated UI via `can()` / `canApprove()` — reflects that
  role consistently across a session, surviving the role-switch-on-login-screen flow.
- Settings modal restructured to accommodate this.

**Files touched:** `lib/role-context.tsx`, `app/login/page.tsx`,
`components/users-roles-view.tsx`, `components/settings-modal.tsx`, `lib/data.ts`

---

## v0.3.0 — 2026-06-13
**Login/auth screen redesign; brand identity**

- Commits: `d15ab52`, `9ccb383`

**Business logic:**
- Login, Forgot Password, and Chat screens redesigned; new brand logo component and
  asset introduced (`components/brand-logo.tsx`).
- Applications detail page and dashboard bar chart received responsive fixes.
- (This is the groundwork the Jun 15 role-based sign-in above builds directly on top of.)

**Files touched:** `app/login/page.tsx`, `app/forgot-password/page.tsx`,
`app/chat/page.tsx`, `components/brand-logo.tsx` (new),
`app/customer/applications/[id]/page.tsx`, `components/bar-chart.tsx`

---

## v0.2.0 — 2026-06-12
**Responsive layout pass; Change PIN and Feedback Response modals**

- Commits: `fdd8072`, `d14487a`, `94bd5cf`

**Business logic:**
- New **Change PIN** modal and **Feedback Response** modal (the latter is what powers
  the reply flow later formalized in v0.5.0's Feedback page).
- Broad responsive/layout refinements across Chat, Accounts, Applications, and
  Consultations pages; minor layout adjustments to the page header and settings modal.

**Files touched:** `app/chat/page.tsx`, `app/customer/accounts/[id]/page.tsx`,
`app/customer/accounts/page.tsx`, `app/customer/consultations/page.tsx`,
`components/change-pin-modal.tsx` (new), `components/feedback-response-modal.tsx` (new)

---

## v0.1.0 — 2026-06-11
**Baseline: Loan Product page**

- Commits: `fb7be06`

**Business logic:** earliest work in this tracked window — a major rework of the Loan
Product page (~450 lines). Treated as the baseline entry for this changelog rather
than reconstructed further back.

**Files touched:** `app/loan-product/page.tsx`, `lib/data.ts`
