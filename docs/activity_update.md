# Activity Update

> Running log of changes shipped to the WeLoan365 admin prototype.
> Newest section on top.
> Audience: PM, design reviewers, dev hand-off.
> Build status at every entry: `npm run build` ✓ clean.

---

# Today

## Table of contents

- [Settings → Users & Roles — Add/Edit User](#settings--users--roles--addedit-user)
- [Settings → Users & Roles — Users table](#settings--users--roles--users-table)
- [Settings → Referral — Credit Officer codes](#settings--referral--credit-officer-codes)
- [Design consistency pass](#design-consistency-pass)
- [Promotion](#promotion)
- [Sidebar](#sidebar)
- [Loan Application — Re-structure flow](#loan-application--re-structure-flow)
- [Data model changes (today)](#data-model-changes-today)
- [Build status (today)](#build-status-today)

---

## Settings → Users & Roles — Add/Edit User

### Status as an on/off toggle (re-introduced)

The Status field is back in the form, this time as a **toggle switch** (Active = on, Inactive = off) instead of the old segmented picker.

```
┌─────────────────────────────────────────────────────────────────┐
│ Status                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Active                                            [ ═══● ]  │ │
│ │ User can sign in and perform actions allowed by their role. │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- Switch primitive matches every other on/off switch in the app: `h-5 w-9` track, `bg-brand-600 / bg-gray-300`, `h-4 w-4` white thumb that slides between `translate-x-0.5` and `translate-x-[18px]`.
- Label text changes with state: emerald **"Active"** ↔ gray **"Inactive"**, with helper copy explaining what each state means.
- `role="switch"` + `aria-checked` + title tooltip for screen readers.
- New state hook: `const [active, setActive] = useState<boolean>(user?.status !== "Inactive")`.
- Save: `status: active ? "Active" : "Inactive"` (replaces the old fallback that hid the field).

### 5-digit Code field now persists

The 5-char OTP-style Code field in the form now actually writes to the `StaffUser` record (`code: code.trim() || undefined`). Editing a user prefills the existing code (`user?.code ?? ""`). Clearing it removes the entry from the CO codes table (see Referral section below).

The form also preserves `referralStats` on edit so editing a user doesn't reset their referral counters.

---

## Settings → Users & Roles — Users table

### Status column (added back)

The Status column reappears after the Branch column, fed by `StaffUser.status`. Uses `<StatusBadge>` for visual consistency with the rest of the app.

```
┌──────────────────┬─────────────────┬──────────────┬──────────┬──────┐
│ User             │ Role            │ Branch       │ Status   │      │
├──────────────────┼─────────────────┼──────────────┼──────────┼──────┤
│ Laybun N.        │ Credit Officer  │ Phnom Penh   │ Active   │ Edit │
│ 10247            │                 │              │          │      │
│ Kosal M.         │ 👑 Admin        │ HQ           │ Inactive │ Edit │
│ 10502            │                 │              │          │      │
└──────────────────┴─────────────────┴──────────────┴──────────┴──────┘
```

Header order: `User · Role · Branch · Status · (Edit)`. Empty-state `colSpan` bumped 4 → 5.

### User column — avatar + email replaced by name + code

- Avatar circle with initials (`LN`, `SK`, `RL`, …) **removed**.
- Email under the name **removed**.
- Replaced with the **5-digit referral code** rendered in `font-mono tracking-wider text-gray-500`.
- Users without a code (Mengsrun H. in seed) show muted italic **"No code"** placeholder.

The cell now reads as:

```
Laybun N.
10247
```

The code displayed here is the same value that drives the Credit Officer codes table on Settings → Referral, so the operator can match a user to their referral entry at a glance.

---

## Settings → Referral — Credit Officer codes

### Now derived from `USERS`

The CO codes table no longer reads from a hardcoded `CO_CODES` array. It maps `USERS.filter(u => !!u.code)` into rows, so any user with a code automatically appears.

```ts
{ id, code, name, role, branch, referrals, applications, disbursed, disabled: u.status !== "Active" }
```

Seven seeded users → six codes in the demo (Mengsrun H. has no code).

### Disabled-row design for Inactive users

A row whose underlying user is **Inactive** renders muted:

- Row: `bg-gray-50/60` + `opacity-60` tint.
- Code cell: `text-gray-400 line-through font-mono`. Copy icon `disabled` + `cursor-not-allowed text-gray-300`.
- Inline `<StatusBadge status="Inactive" />` next to the code makes the *reason* the row is disabled explicit.
- Officer name: dims to `text-gray-500`.
- Disbursed: loses bold treatment.
- Row tooltip: *"User is Inactive — referral code is disabled."*

### Empty state

If nobody has a code:

> *"No referral codes assigned yet. Add a code to a user in Users & Roles → Add user."*

### One source of truth

Setting a code on a user (Users & Roles → Add/Edit) and toggling Active/Inactive both directly affect the CO codes table — they're now one cohesive record.

---

## Design consistency pass

### All status indicators go through `<StatusBadge>`

| Location | Before | After |
|---|---|---|
| Settings → Users table → Status column | Custom emerald/gray rounded-full pill with a dot indicator | `<StatusBadge status={u.status} />` |
| Customer Messages → Feedback row → Status column | Custom emerald/gray rounded-full pill with `CheckCircle2` icon | `<StatusBadge status={responded ? "Replied" : "No reply"} />` |

Two new statuses added to the central `TONES` map in `components/status-badge.tsx`:

| Status | Tone |
|---|---|
| `Replied` | emerald (`bg-emerald-50 text-emerald-700`) |
| `No reply` | gray (`bg-gray-100 text-gray-600`) |

### All on/off toggles use the same brand-blue switch

- Switch primitive: `h-5 w-9` track + `h-4 w-4` white thumb.
- On: `bg-brand-600`. Off: `bg-gray-300`.
- Thumb slides between `translate-x-0.5` and `translate-x-[18px]`.
- Used in: Loan Product Key Features / Eligibility rows · Promotion Set deadline · Settings → Users → Add/Edit User Status.
- Settings → Users Status toggle changed from emerald → brand-blue for switch-primitive consistency. Semantic emerald color still appears on the **label text** ("Active") so it matches the StatusBadge pill in the table.

### Rule going forward

- **Status of a record** → `<StatusBadge>`. Add new tones to the central `TONES` map.
- **Boolean on/off control** → standard brand-blue switch.
- **Action button / icon tag** (Reset PIN, Re-structure request, Type chip) → contextual chip, not a status badge.

---

## Promotion

### Author column (mirrors Blog Posts)

| Promotion | Author | Status | Date | End date | |
|---|---|---|---|---|---|
| Khmer New Year — 0%… | Sophea K. | Active | 2026-04-10 | 2026-04-30 | Edit Delete |
| Refer a Friend | Laybun N. | Active | 2026-03-22 | No deadline | Edit Delete |
| Birthday Month | Sophea K. | Active | 2026-02-14 | 2026-12-31 | Edit Delete |
| Housing Loan Launch | Admin | Inactive | 2026-01-05 | No deadline | Edit Delete |

- New required `author: string` field on `Promotion`.
- All 4 seed promotions got an author: Sophea K. / Laybun N. / Sophea K. / Admin.
- Author column rendered as `text-gray-700 text-xs` between Promotion and Status (mirrors blog posts' `Post · Category · Author · Status · Views · Date`).

### Author field in the create/edit modal

```
┌────────────────────────────────────────────┐
│ Author                                     │
│ ┌────────────────────────────────────────┐ │
│ │ Sophea K.                              │ │   (gray-50 bg, gray-600 text)
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

- Read-only input, placed between Image and Set deadline.
- **Create:** value = `authorName` from `useRole().user.name`.
- **Edit:** value = `initial.author` (preserved — the author never changes).
- Identical pattern to the blog-post editor.

### End date column

- New "End date" column added after Date.
- Reads directly from `Promotion.deadline` (already wired to the "Set deadline" toggle in the editor).
- With deadline → ISO date `text-gray-700`.
- Without deadline → muted italic **"No deadline"** in `text-gray-300`.

Seed data updated so the demo shows both cases:

| Promotion | Date | End date |
|---|---|---|
| Khmer New Year — 0% Processing Fee | 2026-04-10 | **2026-04-30** *(30-day promo)* |
| Refer a Friend, Earn $10 | 2026-03-22 | *No deadline* *(evergreen)* |
| Birthday Month — 0.5% Off APR | 2026-02-14 | **2026-12-31** *(year-end)* |
| Housing Loan Launch Offer | 2026-01-05 | *No deadline* |

---

## Sidebar

| Before | After |
|---|---|
| `Customer → Messages` | **`Customer → Consult & Feedback`** |

The single sidebar entry under Customer that opens the unified inbox now reads "Consult & Feedback" — more descriptive of what's inside.

---

## Loan Application — Re-structure flow

### Three-state status pill on the Re-structure tab

The pill in the top-right of the section is now **always visible** (previously only appeared after a decision) and reflects the lifecycle:

| Decision state | Pill text | Color |
|---|---|---|
| **pending** (default) | `↻ Re-structure request` | brand-blue (`bg-brand-50 border-brand-200 text-brand-700`) |
| **approved** | `✓ Accepted` | emerald (`bg-emerald-50 border-emerald-200 text-emerald-700`) |
| **declined** | `✗ Re-structure request failed` | **red** (`bg-red-50 border-red-200 text-red-700`) |

Click **Decline request** → header pill flips to a red **Re-structure request failed** badge.

### Button rename

| Before | After |
|---|---|
| `Approve re-structure` | **`Accept`** |

Green emerald button still uses `CheckCircle2` icon. Matches the loan-application top-right "Accept" button convention.

### Status pill mirrors into the All Applications list

The Remark column on `/customer/applications` now shows the **same three pills** as the detail tab:

| Decision | List Remark cell |
|---|---|
| pending | blue `↻ Re-structure request` |
| approved | emerald `✓ Accepted` |
| declined | red `✗ Re-structure request failed` |

Wording, icons, and colors all match between list and detail — operator's eye can pick up state without opening the page.

### Detail tab reads initial decision from data

`RestructureTab`'s local `decision` state seeds from `a.restructureRequest?.decision ?? "pending"` on first render. Opening an already-declined request:

- Header pill already shows red **Re-structure request failed**.
- Both action buttons already disabled (decision is no longer pending).

Clicking Approve / Decline on a still-pending request still works as a local-state demo (change is lost on navigation — to make the detail-page decision write back to the list, lift state up to a parent context).

---

## Data model changes (today)

### `lib/data.ts`

| Type / constant | Change |
|---|---|
| `RestructureRequest` | New optional `decision?: "pending" \| "approved" \| "declined"` field, JSDoc explaining each value's UI rendering. |
| `Promotion` | New required `author: string` field. |
| `StaffUser` | New optional `code?: string` (5-char referral code) and `referralStats?: { referrals; applications; disbursed }` fields. |
| `StatusBadge.TONES` | Added `Replied` (emerald) and `No reply` (gray). |
| Seed `APPLICATIONS` | APP-10298 (Rithy Pen) got `restructureRequest.decision: "declined"` so the red pill is demonstrable in the list. |
| Seed `USERS` | All 6 active users got realistic codes (10247, 10248, 10312, 10402, 10401, 10502) and `referralStats`. Mengsrun H. left without a code so empty-state path is testable. |
| Seed `PROMOTIONS` | All 4 promotions got an `author`. PM-001 (Khmer New Year) and PM-003 (Birthday Month) got `deadline` values. |

---

## Build status (today)

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (12/12)

Route                              Size     First Load JS
─ /                                1.35 kB     102 kB
─ /chat                            2.15 kB      98 kB
─ /content/posts                   7.95 kB     111 kB
─ /content/promotions              5.32 kB     108 kB    ← Author + End date
─ /customer/accounts               4.25 kB     114 kB
ƒ /customer/accounts/[id]          3.91 kB     114 kB
─ /customer/applications           4.88 kB     115 kB    ← three-state Remark
ƒ /customer/applications/[id]     12.60 kB     122 kB    ← Re-structure pill
─ /customer/consultations          8.37 kB     118 kB
─ /forgot-password                 5.57 kB     106 kB
─ /loan-product                   15.40 kB     118 kB
─ /login                           3.85 kB     105 kB
```

No type errors, no broken imports, no orphan dead code.

---

---

# Yesterday

## Table of contents

- [Dashboard / Overview](#dashboard--overview)
- [Sidebar (yesterday)](#sidebar-yesterday)
- [Customer — All Accounts (list)](#customer--all-accounts-list)
- [Customer — All Accounts (detail)](#customer--all-accounts-detail)
- [Customer — Messages (merged Consultations + Feedback)](#customer--messages-merged-consultations--feedback)
- [Loan Application (list)](#loan-application-list)
- [Loan Application (detail)](#loan-application-detail)
- [Reports & Analytics tab](#reports--analytics-tab)
- [Loan Product (list)](#loan-product-list)
- [Loan Product — Create / Edit](#loan-product--create--edit)
- [Blog Posts](#blog-posts)
- [Promotion (yesterday)](#promotion-yesterday)
- [Settings — Referral Program](#settings--referral-program)
- [Settings — Users & Roles (yesterday)](#settings--users--roles-yesterday)
- [Settings — Permissions catalogue](#settings--permissions-catalogue)
- [Settings — Apply Loan Setting](#settings--apply-loan-setting)
- [Settings modal — global](#settings-modal--global)
- [Data model changes (yesterday)](#data-model-changes-yesterday)
- [Documentation files](#documentation-files)

---

## Dashboard / Overview

- **Bar chart now animates on mount.** Each monthly bar rises from 0 → its real height with an `800ms cubic-bezier(0.22, 1, 0.36, 1)` ease-out, staggered left → right (60 ms per bar). A 1-px "wick" sprouts on top of each bar 500 ms into its animation, giving a candle-style entrance. Tooltip on the highlighted month waits for the last bar to settle (≈ 1.5 s total).
- **Dashboard "Loan Applications" table** lost the leading **ID** column for a leaner look.

## Sidebar (yesterday)

- **Search input + `/` shortcut hint removed.** Navigation now starts directly below the WeLoan365 logo.
- **Customer group sub-items consolidated** to just **All Accounts · Messages** (Messages replaces the separate Consultations + Feedback & Rate entries).
- New `matchHrefs?: string[]` field on `Leaf` so a single sidebar entry can stay active across multiple routes (used briefly during the Consultations + Feedback merge — see below).

---

## Customer — All Accounts (list)

| Change | Detail |
|---|---|
| Table columns | Final: `ID · Name · Phone · KYC · Loans · Branch · Device · Security · Detail →` |
| Filter | Real dropdown — Status (KYC) facet + Branch facet, with active-count badge and "Clear all". |
| Pagination | Wired (page size 5), Page N of M indicator, disabled-at-edges Prev/Next. |
| "Add Customer" button | Removed. |
| Email column | Removed. |
| Avatar circles | Removed. |
| **Security** column | Per-row amber pill `🔑 Reset PIN`. Click navigates to the customer detail page. |
| **Device** column | Shows the customer's primary device model, truncated to **7 chars + …**. Hover surfaces a custom dark popup tooltip (`bg-gray-900 text-white shadow-lg` with a caret) showing the full model name. |

## Customer — All Accounts (detail)

- **Back arrow inside the card header — removed.** The "← Back to applications" link above the card stays.
- **Email line in the customer header — removed.** Header now shows phone only.
- **"Edit profile" button → "Change password for customer"** with a `KeyRound` icon. Gated by the new `customer.pin_reset` permission (was `customer.edit`).
- **Loan rows match the loan count.** Sokha Chan (`C-0421`, `loans: 2`) now shows both rows — added a second `APP-10231` Personal loan to the seed data.

---

## Customer — Messages (merged Consultations + Feedback)

The two separate pages are now **one unified inbox** at `/customer/consultations` (the `/customer/feedback` route is **deleted**). Single sidebar entry called **Messages** (renamed today to **Consult & Feedback**).

### Unified inbox structure

- Page title: **Customer Messages** with subtitle `N messages · X unassigned · Y unreplied`.
- **Three filter chips** at the top: `All (N)` · `Consultations (N)` · `Feedback (N)` — Consultations chip shows `X unassigned`, Feedback chip shows `Y unreplied`.
- **Single 7-column table** with mixed rows, sorted newest first:
  `Type · Customer · Subject · Preview · Date · Status · (Action)`
- **Type chip** colored per row: brand `💬 Consult` or gray `📝 Feedback`. **No stars anywhere** — feedback rows ignore the rating field.
- Whole row is clickable; action button on the right opens the right modal:
  - Consultation row → **ConsultationDetailModal** (existing chat + assign + close + reopen flow).
  - Feedback row → **ResponseModal** (extracted into this file; identical UX to the old reply modal).
- 8 rows per page, with `Showing X-Y of N` + Page N of M pagination. Filter change auto-resets to page 1.

### Consultation detail modal — earlier polish work that's still in

- **"Customer's request" intake card** at the top of the popup — `Topic · Preferred date · Preferred time · Preferred branch · Officer · Notes` rendered as one bordered `<dl>` (single-box style).
- **"Assign to me" replaced everywhere with "Assign to person"** — opens the existing officer picker. The picker still has a "Quick-assign to me" shortcut row inside.
- **Mark as closed** now triggers an **inline confirmation overlay** scoped to the modal (not a stacked second modal). Cancel / Yes, mark as closed.
- **When closed:** Reassign-to-person hides; the green "Mark as closed" button is replaced by a neutral **Edit** button that calls `reopenConsultation()` (flips status back to `open` / `pending`).
- Header email line removed; only phone + "Open profile" link remain.

### Feedback / response work that's still in

- **Star icons + star overview cards — removed.** Both list view and reply modal.
- Reply modal preserved — 280-char limit, "Edit response" mode when one already exists, "Previously sent on …" timestamp pill.

### Files removed

- `app/customer/feedback/` — deleted (route gone).
- `components/messages-tabs.tsx` — deleted (no longer needed after the table-level merge).

---

## Loan Application (list)

| Change | Detail |
|---|---|
| Table columns | Final: `ID · Customer · Branch · Loan range · Applied · Status · Remark · Detail →` |
| ID column | Added back as a leading `font-mono text-xs` column. |
| Filter | Replaced the heavy 5-facet "Advanced filter" popover with a clean 2-facet **Simple filter**: Status (Progress / Approved / Rejected) + Branch (multi-select). |
| Pagination | Numbered page buttons + Prev/Next, page size 8. |
| "New Application" button | Removed (along with `NewApplicationModal`, `createOpen` state, `handleCreate`, `nextId` and ~750 lines of dead code). |
| Export button | Moved from the page header into the table toolbar (next to Filter). |
| **Remark** column | Added. Shows a compact `↻ Re-structure request` pill for **Approved** applications that have a customer-submitted `restructureRequest`. Empty em-dash for other rows. *(Today the pill became three-state — see Today section.)* |
| `restructure pill` styling | Brand-50 background, brand-200 border, brand-700 text, `w-2.5` icon — matches the existing chip language. |

## Loan Application (detail)

### Header

- `{a.rate}% APR` token removed from every application summary line (header subtitle, restructure section, shared modal). Loan-product Rate range displays are unchanged (they describe a product, not an application).
- In-header back-arrow next to the application ID removed; the "← Back to applications" link above the card is the single back path.

### Tab visibility rules (status-aware)

| Status | Visible tabs |
|---|---|
| **Progress** | Loan Status · KYC / Docs / CBC · Guarantor info · Reminders · Audit Log · Reports & Analytics · Person in Charge |
| **Approved** | …all of the above + **Repayment & Collection** + **Re-structure** |
| **Rejected** | Loan Status · KYC / Docs / CBC · Audit Log · Person in Charge |

Logic centralised in `visibleTabs` via two extra clauses:

```ts
if (t.key === "restructure" && a.status !== "Approved") return false;
if (t.key === "repayment"   && a.status === "Progress") return false;
if (a.status === "Rejected") {
  const REJECTED_TABS: TabKey[] = ["status", "kyc", "audit", "officer"];
  if (!REJECTED_TABS.includes(t.key)) return false;
}
```

### Loan Status tab — rejected workflow

Rejection now lands on **Document Review** (red `failed` state). Credit Check and Approval stay `pending` (gray) — they never happened.

### New tab — Guarantor info

- Top-level peer tab next to KYC / Docs / CBC.
- 2-column layout: Guarantor — personal info (left) + Guarantor — CBC report (right).
- Personal info rows (final, after trim): **National ID · Date of birth · Address · Guarantee for**. Removed `Relationship to applicant`, `Occupation`, `Monthly income` rows per spec.

### New tab — Re-structure

- Peer of "Person in Charge" — only visible on **Approved** loans.
- Renders one of three states inline:
  1. **Approved + has request** → full request panel (header card with customer name + request meta, side-by-side `Reason / Requested change`, Chat/Call contact buttons, **Decline / Approve** decision footer with sticky verdict pill after decision).
  2. **Approved, no request** → empty placeholder.
  3. **Not approved** → "Re-structure not available" empty card.
- Local `decision: "pending" | "approved" | "declined"` state for the demo flow; both buttons disable after a decision and the header gets a colored verdict pill. *(Today the pill became always-visible with three colors — see Today section.)*

### Person in Charge tab — restructure indicator earlier in the day

- Briefly added a `↻ Re-structure request` pill next to the officer's name. **Moved to its own tab** later in the day; the pill now lives only in the list view "Remark" column.

### Reports & Analytics tab

- Behavior unchanged this iteration — the four cards are still hard-coded.
- Full implementation spec written for the dev team: see **[`docs/reports-analytics-spec.md`](./reports-analytics-spec.md)** for the dynamic formulas (Time to approval, Risk rating, PD, Recommended action), acceptance criteria, unit tests, and rollout plan.

---

## Loan Product (list)

### Table shape

| Change | Detail |
|---|---|
| New `#` column | Leading column with the **1-based position** number for every top-level product and a `GripVertical` drag handle. Sub-products show an empty cell. |
| Other columns | `Name · Amount range · Rate · Term · Active loans · Status · Detail →`. |
| Sub-product styling | Indented `pl-12`, light-gray `└` connector char, 2-letter country code in muted text, name in lighter weight, subtle `bg-gray-50/30` row tint. |
| MWL sub-product names | Auto-generated as `MWL — [Country]` (short prefix matching existing `MWL — Korea`/Japan/Singapore). |
| Country code on each sub-row | 2-letter uppercase text label (`KR`, `JP`, `MY`, `AR`, …). New `countryCodeFor(name)` helper in `lib/data.ts` with an ISO 3166-1 alpha-2 lookup table for common destinations (40+ entries) + first-2-letter fallback. |
| **Range collapse** | When `min === max`, the cell shows a single value (`13.5%` instead of `13.5% – 13.5%`, `36m` instead of `36–36m`). Same treatment in the detail-modal stat tiles. |

### Drag-and-drop reordering

- Whole row is draggable for top-level products (sub-products are not draggable; they ride along with their parent block).
- Native HTML5 DnD; no library added.
- Drag in progress: source row dims to `opacity-40`. Hover target: `ring-2 ring-inset ring-brand-300 bg-brand-50/40` highlight.
- New helper `moveTopLevelTo(draggedId, targetId)` groups the array into parent-plus-subs blocks, removes the dragged block, and re-inserts it before the target — so dragging `Migrant Worker Loan` to position 1 carries all 3 country sub-products with it.

### Catalogue contents

- **Old 5 products removed:** Personal · SME Micro · Auto · Agri · Education (LP-01 → LP-05).
- **4 NHFC products added at the top:**
  - `LP-07` **Micro Loan (ML)** — $100–$3,000 · 14–18% · 6–48m
  - `LP-08` **Small Business Loan (SBL)** — $1,000–$30,000 · 12–16% · 6–96m
  - `LP-09` **Small & Medium Enterprise (SME)** — $5,000–$100,000 · 11–15% · 6–120m
  - `LP-10` **Housing Loan (HL)** — $10,000–$300,000 · 9–13% · 12–240m
- **MWL family kept** (parent + 3 country sub-products), shorthand names: `MWL — Korea`, `MWL — Japan`, `MWL — Singapore` (parenthetical visa codes removed).
- All seeded **APPLICATIONS** re-mapped to the new product names:
  Personal → Micro Loan (ML) · SME Micro → Small Business Loan (SBL) · Auto → Small & Medium Enterprise (SME) · Agri → Micro Loan (ML).
- All seeded **CONSULTATIONS** topics + the **POSTS** birthday-discount and Education-Loan announcement updated accordingly.

## Loan Product — Create / Edit

### Three-category form (mirrors the NHFC reference sheet)

1. **Basic Information** — Product name (top), Description textarea.
2. **Key Features** — `Loan Size · Interest · Loan Term · Repayment Method`.
3. **Eligibility** — `Age · Residence · Income · Collateral`.

### Show / hide toggles per row

- Each Key-Features / Eligibility row sits inside a shared bordered card with `divide-y` between rows (single-box style).
- **On/off switch** on the right of each row (replaces the earlier "SHOWN/HIDDEN" pill). `role="switch"` + `aria-checked` for screen readers.
- Toggling off **dims** the row (`opacity-50 pointer-events-none select-none`) but **does not hide it** — the input stays visible so the operator can see what was previously entered.
- Hidden rows save as zero / empty string so downstream tables read `0–0`-style placeholders instead of stale values.

### Input cleanups

- **Interest** and **Loan Term** are single-value inputs now (writes the typed value to both `min` and `max` so the schema is unchanged).
- **Loan Size** keeps its `$min – $max` two-input range.
- New `AffixInput` helper component for `$ / % / m` decorated inputs — uses flex (not absolute positioning) so the affix and the value share the same baseline. Focus ring wraps the whole label so clicking the affix focuses the input.
- Native number-input spinners hidden globally on `form-input[type="number"]` via `appearance: textfield` + `::-webkit-*-spin-button { appearance: none }`.
- `form-input` CSS switched from shorthand `padding: 0.5rem 0.75rem` to per-side properties + explicit `line-height: 1.25rem` so text is vertically centered and Tailwind's `pl-*/pr-*` utilities can override individual sides.

### MWL flow

- MWL mode no longer creates a new parent. New entries always attach to the existing **Migrant Worker Loan** parent (`LP-06`) as sub-products.
- **Destination countries** is a free-form chip input now (was a fixed checkbox grid of KR/JP/SG):
  - Type a country, press Enter or click `+ Add`.
  - Each chip shows the auto-derived 2-letter ISO code on the left (e.g. `[AE United Arab Emirates ×]`).
  - Section is positioned **below** Description so Product Name stays the first input the admin sees.
- Sub-products are saved with name `MWL — [Country]` and id `${nextId}-${ISOCODE}-${idx}` (collision-safe).

### Edit mode

- Detail modal's previously-dead **Edit** button now closes the detail modal and re-opens the create-product modal in **edit mode** prefilled with the product's data.
- Modal title becomes "Edit loan product" with subtitle `Editing LP-08 · changes save in place.`.
- Buttons relabel to **Save as draft / Save changes** when editing.
- Product name field is always shown in edit mode (even for MWL sub-products, so they can be renamed).
- MWL kind tabs + Destination countries section hidden in edit mode (kind is immutable).
- `handleSaveProduct` now replaces by id when the product already exists (and prepends when it doesn't), so create + edit share one handler.

---

## Blog Posts

- **Categories rewritten** to: `Blog · News · Tips · Edu · CSR`.
- Removed the old `Announcement` and `Promotion` categories.
- Existing posts remapped (announcement → news, promotion → csr).
- **Two new seed posts** to demonstrate the new categories:
  - `P-007` *Scholarships for rural students — 2026 program* (**CSR**).
  - `P-006` *Budgeting 101 — the 50/30/20 rule* (**Edu**).
- List view, filter chips, badges, and create/edit form all read from the updated `POST_CATEGORIES` — no UI rewrite needed (the page renders dynamically).

## Promotion (yesterday)

- **Status field** (Active / Inactive picker) removed from the create/edit modal. Status preserved on save: existing value when editing, defaults to `"Active"` for new promotions. Table column unchanged.
- **New optional Deadline field** with the same toggle pattern from the loan-product form:
  - On/off switch on the right.
  - Native `<input type="date">` below.
  - When the toggle is **off**, the date input is dimmed + disabled (not hidden). Saved as `deadline: undefined`.
  - When **on**, validates that a date is picked. Saved as `deadline: "YYYY-MM-DD"`.
- New optional `deadline?: string` field on the `Promotion` type.

---

## Settings — Referral Program

- **"Program status" toggle** in the header — removed.
- **"Issue new code" button** — removed.
- **Credit Officer codes table** trimmed from 8 columns to 5: `Code · Officer · Branch · Apps · Disbursed` (removed `Referrals`, `Status`, and the trailing `Regenerate` action). Underlying data fields preserved.
- **"Save changes" button** at the bottom — removed.

## Settings — Users & Roles (yesterday)

### Add / Edit user modal

- **New Password field** — required on create, optional on edit ("Leave blank to keep current password"). `type="password"` with an inline `Eye / EyeOff` show-hide toggle. Min 6 chars when set.
- **New 5-char Code field** — fixed-width slot (`w-[7.5rem]`) styled like an OTP input (`font-mono tracking-[0.4em] text-center uppercase`). Auto-uppercases, strips non-alphanumeric, clamps to 5 chars on every keystroke. Live `N / 5` counter to the right. Optional, but if entered must be exactly 5 chars.
- **Status field** (Active / Inactive picker) removed from the form. *(Today it's back as an on/off toggle — see Today section.)*

### Staff Users table

- **Status column** removed. *(Today it's back, fed by `StatusBadge` — see Today section.)*
- Per-row **Activate / Deactivate** action button removed.
- Empty-state `colSpan` adjusted.

### Create Role modal — permission picker

- Categories reordered + renamed to **mirror the left sidebar exactly** (Overview → Customer-Accounts/Consultations/Feedback → Loan Application → Loan Product → Blog Posts → Promotion → Setting). Form renders dynamically via `groupBy(PERMISSIONS, p => p.category)` so no UI changes were needed.
- See next section for the catalogue itself.

## Settings — Permissions catalogue

### Final shape

| Sidebar mirror | Category | Permissions |
|---|---|---|
| Overview → Report & Analyze | **Overview** | `report.view`, `report.export` |
| Customer → All Accounts | **Customer — All Accounts** | `customer.view`, `customer.pin_reset` (sensitive) |
| Customer → Consultations | **Customer — Consultations** | `consultation.view`, `consultation.assign`, `consultation.reply`, `consultation.close` |
| Customer → Feedback & Rate | **Customer — Feedback & Rate** | `feedback.view`, `feedback.reply` |
| Loan Application | **Loan Application** | `loan.view`, `loan.review`, `loan.approve` *(label: **Accept application**, sensitive)*, `loan.reject`, `loan.reassign`, `loan.restructure` (sensitive), `payment.view`, `payment.record` |
| Loan Product | **Loan Product** | `product.view`, `product.create`, `product.edit`, `product.reorder`, `product.activate` (sensitive) |
| Blog Posts | **Blog Posts** | `post.view`, `post.manage` (sensitive) |
| Promotion | **Promotion** | `promotion.view`, `promotion.manage` (sensitive) |
| Setting | **Setting** | `setting.view`, `setting.edit` (sensitive), `user.view`, `user.create` (sensitive), `user.edit`, `role.edit` (sensitive) |

**Total: 33 permissions.**

### Removed during the day

| Category | Removed |
|---|---|
| Customer — All Accounts | `customer.create`, `customer.edit`, `customer.kyc` |
| Loan Application | `loan.create` |
| Setting | `audit.view`, `audit.export` |
| Loan Portfolio (whole category) | `portfolio.view`, `portfolio.restructure`, `portfolio.writeoff` |
| Repayment (whole category) | `payment.reverse` (kept `payment.view` + `payment.record` under Loan Application) |
| Branch (whole category) | `branch.locator` and the four `branch.phnom_penh` / etc. (followed the removal of `branchScope`) |

### Renamed

- `loan.approve` label `Approve application` → **`Accept application`**.

### Role definitions updated

The 3 seeded roles (Senior Officer, Credit Officer, Customer Service) were rewritten to reference only the new keys (no orphan permissions). Admin stays as `permissions: "*"`.

### Code consumer updates

- `app/customer/accounts/[id]/page.tsx` — the "Change password for customer" button is now gated by `customer.pin_reset` (was `customer.edit`).
- `app/customer/applications/[id]/page.tsx` — Audit Log tab keeps the `audit.view` gate (admin-only via the `"*"` wildcard).

## Settings — Apply Loan Setting

- **Per-page description editor now has a draft → save flow.**
  - Opening a page loads its description into a local `draftDesc` state.
  - Status indicator above the textarea: amber `Unsaved changes` while dirty, emerald `Saved` flashes for ~1.8 s after a successful save, otherwise nothing.
  - Insert-placeholder buttons (`{{name}}`, `{{branch}}`, …) append to the draft.
  - **Discard** button rolls back to the saved value (disabled when pristine).
  - **Save** button commits via `updateDescription(idx, draftDesc)` (disabled when pristine).
  - Switching tabs or opening a different page re-syncs the draft to that page's saved description.

## Settings modal — global

- **Container width** changed from `max-w-5xl` (1024 px) to **`max-w-6xl` (1152 px)** — 128 px wider. Height constraints unchanged.

---

## Data model changes (yesterday)

### `lib/data.ts`

| Type / constant | Change |
|---|---|
| `Role` | `branchScope` removed earlier in the week; yesterday removed entirely from form + display. |
| `LoanProduct` | New optional `repaymentMethod?: string`. `country` widened from `"KR" \| "JP" \| "SG"` → `string` so admins can add any destination. |
| `Customer` | New `devices: CustomerDevice[]`. |
| `CustomerDevice` | New type: `{ platform: "ios" \| "android"; model: string; os?: string; lastSeen?: string }`. |
| `Promotion` | New optional `deadline?: string`. |
| `PostCategoryId` | Now `"blog" \| "news" \| "tips" \| "edu" \| "csr"` (was 5 different values including `announcement` and `promotion`). |
| `PermissionCategory` | Restructured to mirror sidebar — 9 categories (see permissions section above). |
| `PERMISSIONS` | Pruned + reordered; 33 entries total. |
| `ROLES` | All 3 system roles rewritten with new keys. |
| `PRODUCTS` | Removed LP-01..LP-05, added LP-07..LP-10 (NHFC catalogue) at the top. MWL family kept. |
| `APPLICATIONS` | Every row remapped to the new product names. Sokha Chan gained second loan `APP-10231` to match `loans: 2`. |
| `CONSULTATIONS` | Topics + notes updated for new product names; structured intake fields (`preferredBranch`, `preferredDate`, `preferredTime`, `note`) preserved. |
| `POSTS` | Categories remapped; +2 new posts (P-006 Edu, P-007 CSR). |
| `MWL_COUNTRIES` | Unchanged — still the lookup source for flag/name on legacy KR/JP/SG codes. |
| **New helper:** `countryCodeFor(name): string` | Returns ISO 3166-1 alpha-2 for ~40 common overseas-worker destinations; falls back to first two letters. |

---

## Documentation files

| File | Purpose |
|---|---|
| `docs/reports-analytics-spec.md` | Full implementation spec for the Loan Application → Reports & Analytics tab. Covers data sources, per-card formulas (Time to approval, Risk rating, PD, Recommended action), drop-in `ReportsTab` code, helper functions, acceptance criteria, Jest tests, rollout plan. |
| `docs/activity_update.md` | This file. |
