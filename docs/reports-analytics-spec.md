# Reports & Analytics — Implementation Spec

> Loan Application Detail → **Reports & Analytics** tab
> File: `app/customer/applications/[id]/page.tsx` (function `ReportsTab`, ~line 1117)
> Status: hard-coded prototype today → ready to wire to real data.

---

## 1. Overview

The Reports & Analytics tab is a **single row of four cards** that summarise the loan application's performance and risk. It is the only tab whose values are derived (not stored), so this spec is the source of truth for the formulas.

| # | Card | What it answers |
|---|---|---|
| 1 | Time to approval     | "How fast is this loan moving through the workflow?" |
| 2 | Risk rating          | "How risky is this borrower in plain words?" |
| 3 | Default probability  | "What's the modelled chance this loan defaults?" |
| 4 | Recommended action   | "What should the officer do next?" |

The row is a **funnel**: raw signal → categorical bucket → probabilistic estimate → decision.

```
score (712) ──► Risk bucket (Medium-Low) ──► PD (4.9%) ──► Action (Approve)
stage times ──► Time to approval (2.3 d)
```

Today every value is a literal string. After this spec is implemented, all four cards read from `Application` + `getStages()` + `useRole()` — no new data sources required.

---

## 2. Data sources (already in repo)

| Need | Field / call | File |
|---|---|---|
| Credit Bureau score | `Application.score` (300 – 850) | `lib/data.ts` |
| Loan amount | `Application.amount` (USD) | `lib/data.ts` |
| Status (`Progress` / `Approved` / `Rejected`) | `Application.status` | `lib/data.ts` |
| Stage timestamps | `getStages(a.status)` returns `StageInfo[]`; each has `.when?: string` and `.who?: string` | `app/customer/applications/[id]/page.tsx` |
| Approver's role limit | `useRole().role.approvalLimit` (number \| null) | `lib/role-context.tsx` |

Nothing new needs to be added to `Application` for the demo. A future production version would also pull repayment history and DTI (see §7).

---

## 3. Card-by-card logic

### 3.1 Time to approval

**Definition:** wall-clock time between submission and the final decision.

**Inputs**
- `submittedAt` = `Application.sent` (e.g., `"Apr 21, 2026"`).
- `decidedAt`
  - if `status === "Approved"` → the Approval stage's `when`.
  - if `status === "Rejected"` → the failed stage's `when`.
  - if `status === "Progress"` → `null` → display `"—"`.

**Formula**

```
diffDays = floor( (decidedAt - submittedAt) / 1 day )
diffHours = floor( (decidedAt - submittedAt) / 1 hour )
```

**Display**

| Magnitude | Format | Example |
|---|---|---|
| `null` (still in progress) | `"—"` | — |
| `diffHours < 24`   | `"H hr"` | `"18 hr"` |
| `diffDays ≤ 30`    | `"D.d days"` (one decimal) | `"2.3 days"` |
| `diffDays ≤ 90`    | `"W weeks"` (rounded) | `"6 weeks"` |
| `diffDays > 90`    | `"M months"` (rounded) | `"4 months"` |

**Label override:** when `status === "Rejected"`, change the card label from `Time to approval` → `Time to decision`.

**Tone:** neutral (default `<Box>` styling) — this is a performance metric, not a risk metric.

---

### 3.2 Risk rating

**Definition:** a 5-bucket categorical label derived from the CBC score and optional repayment-history modifiers. Designed for officers to scan, not for math.

**Input:** `Application.score` (300–850).

**Bucketing**

| Score range | Bucket | Tone |
|---|---|---|
| 750 – 850 | **Low**         | green  |
| 680 – 749 | **Medium-Low**  | green  |
| 620 – 679 | **Medium**      | amber  |
| 560 – 619 | **Medium-High** | amber  |
| < 560     | **High**        | red    |

**Optional adjustments (apply in order; clamp within the 5 buckets):**

1. **−1 tier (riskier)** if customer has a delinquency ≥ 30 days late in the past 12 months.
2. **−1 tier (riskier)** if **DTI > 50%** (debt-to-income ratio, see §7).
3. **+1 tier (safer)** if a guarantor with `score ≥ 720` is on file.

For the prototype rollout, ship **without** the adjustments (Phase 1) and add them in Phase 2 (§9).

---

### 3.3 Default probability (PD)

**Definition:** the modelled chance the loan defaults at any point during its term, expressed as a percentage.

**Production target:** a calibrated logistic-regression or gradient-boosted model trained on historical loans (features: CBC score, DTI, employment tenure, loan size vs income, prior loans, sector, branch, guarantor presence, KYC verification status). That work is out of scope for Phase 1.

**Phase 1 stand-in formula** (monotonic in CBC score, calibrated to feel realistic):

```
pd = clamp( ((850 - score) / 850) * 30, 0.5, 25 )
pd = round(pd * 10) / 10        // one decimal place
display = `${pd}%`
```

**Reference table**

| Score | Raw PD | Displayed |
|---|---|---|
| 800 | 1.76 | **1.8%** |
| 745 | 3.71 | **3.7%** |
| 712 | 4.87 | **4.9%** |
| 640 | 7.41 | **7.4%** |
| 560 | 10.24 | **10.2%** |
| 480 | 13.06 | **13.1%** |

**Layer-on adjustments (Phase 2):**

- `+1.5 pp` if DTI > 50%.
- `+2.0 pp` if delinquency in last 12 months.
- `−1.0 pp` if guarantor with score ≥ 720.

Apply, then re-clamp to `[0.5, 25]` and re-round.

**Tone (color):** drives the card's `tone` prop.

| PD | Tone |
|---|---|
| < 5%       | **green** |
| 5% – 10%   | **amber** |
| > 10%      | **red**   |

---

### 3.4 Recommended action

**Definition:** a single word telling the officer what to do, combining bucket + PD + amount + the officer's own approval limit.

**Inputs**

- `risk` (from §3.2)
- `pd` (from §3.3)
- `amount` = `Application.amount`
- `limit` = `useRole().role.approvalLimit` (a number, `null` = unlimited)
- `status` = `Application.status`

**Decision tree** (first match wins)

```
if status !== "Progress":
    label = "—"                 // already decided; no recommendation
elif pd >= 15 OR risk == "High":
    label = "Reject"             tone = red
elif limit !== null AND amount > limit:
    label = "Escalate"           tone = blue
elif pd < 5 AND risk in {"Low", "Medium-Low"}:
    label = "Approve"            tone = green
else:
    label = "Review"             tone = amber
```

**Why this order:** decisive cases first (reject and escalate), then the green light, then the residual review bucket. Officers see `Approve` only when the loan is both low-risk **and** within their limit.

---

## 4. Required code changes

### 4.1 Pass the application down

`app/customer/applications/[id]/page.tsx` — change the call site at the tab dispatcher (~line 240):

```tsx
{tab === "reports"     && <ReportsTab a={a} />}
```

### 4.2 Replace the body of `ReportsTab`

Drop-in replacement for the current ~12-line hard-coded version:

```tsx
function ReportsTab({ a }: { a: Application }) {
  /* --- Time to approval ------------------------------------------------ */
  const stages = getStages(a.status);
  const submission = stages.find(s => s.key === "Submission");
  const approval   = stages.find(s => s.key === "Approval");
  const failed     = stages.find(s => s.state === "failed");

  const decidedWhen =
    a.status === "Approved" ? approval?.when :
    a.status === "Rejected" ? failed?.when   : undefined;

  const timeLabel = a.status === "Rejected" ? "Time to decision" : "Time to approval";
  const timeValue = formatTimeBetween(a.sent, decidedWhen);

  /* --- Risk rating ----------------------------------------------------- */
  const risk = bucketScore(a.score);
  const riskTone = risk === "Low" || risk === "Medium-Low" ? "green"
                : risk === "Medium" || risk === "Medium-High" ? "amber"
                : undefined;          // "High" → red handled by Box default

  /* --- Default probability --------------------------------------------- */
  const pd = computePd(a.score);                 // number, 1 decimal place
  const pdTone =
    pd < 5  ? "green" :
    pd < 10 ? "amber" : undefined; // > 10 falls through to red (Box default)

  /* --- Recommended action ---------------------------------------------- */
  const { role } = useRole();
  const action = recommendAction({
    status: a.status,
    pd,
    risk,
    amount: a.amount,
    limit: role.approvalLimit,
  });

  return (
    <>
      <SectionLabel>Application analytics</SectionLabel>
      <div className="grid grid-cols-4 gap-3">
        <Box label={timeLabel}            value={timeValue} />
        <Box label="Risk rating"          value={risk}            tone={riskTone} />
        <Box label="Default probability"  value={`${pd}%`}        tone={pdTone} />
        <Box label="Recommended action"   value={action.label}    tone={action.tone} />
      </div>
    </>
  );
}
```

### 4.3 Pure helpers (colocate at the bottom of the file or in `lib/analytics.ts`)

```ts
export type RiskBucket = "Low" | "Medium-Low" | "Medium" | "Medium-High" | "High";

/** 5-bucket label from CBC score (300–850). */
export function bucketScore(score: number): RiskBucket {
  if (score >= 750) return "Low";
  if (score >= 680) return "Medium-Low";
  if (score >= 620) return "Medium";
  if (score >= 560) return "Medium-High";
  return "High";
}

/** Phase 1 PD stand-in. Monotonic in score, capped in [0.5, 25]. */
export function computePd(score: number): number {
  const raw = ((850 - score) / 850) * 30;
  const clamped = Math.max(0.5, Math.min(25, raw));
  return Math.round(clamped * 10) / 10;
}

/** Format "Apr 21, 2026" → "Apr 23, 2026" gap as "2 days", "18 hr", etc. */
export function formatTimeBetween(fromHuman: string, toHuman?: string): string {
  if (!toHuman) return "—";
  const from = Date.parse(fromHuman);
  const to   = Date.parse(toHuman);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return "—";
  const hours = Math.floor((to - from) / (1000 * 60 * 60));
  if (hours < 24)   return `${hours} hr`;
  const days = Math.floor(hours / 24);
  if (days <= 30)   return `${(hours / 24).toFixed(1)} days`;
  if (days <= 90)   return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

export type Action = { label: "Approve" | "Reject" | "Review" | "Escalate" | "—";
                      tone?: "green" | "amber" | undefined /* red = no tone */ };

export function recommendAction(args: {
  status: "Progress" | "Approved" | "Rejected";
  pd: number;
  risk: RiskBucket;
  amount: number;
  limit: number | null;
}): Action {
  if (args.status !== "Progress")                return { label: "—" };
  if (args.pd >= 15 || args.risk === "High")     return { label: "Reject" };
  if (args.limit !== null && args.amount > args.limit)
                                                  return { label: "Escalate", tone: "amber" };
  if (args.pd < 5 && (args.risk === "Low" || args.risk === "Medium-Low"))
                                                  return { label: "Approve", tone: "green" };
  return { label: "Review", tone: "amber" };
}
```

> The `<Box>` component already exists in the same file and accepts `label`, `value`, `tone` ("green" \| "amber" \| undefined).

---

## 5. Acceptance criteria

A reviewer should be able to open every loan and see all four cards render real values that satisfy:

- [ ] **Time to approval**
  - [ ] `Progress` → `"—"`
  - [ ] `Approved` → matches `approval.when - a.sent` formatted per §3.1.
  - [ ] `Rejected` → card label switches to `"Time to decision"`, value uses the failed stage's `when`.
  - [ ] Any unparseable date → `"—"` (no crash, no `NaN`).
- [ ] **Risk rating**
  - [ ] Pure function of `a.score`; verified for at least one application in each of the 5 buckets.
  - [ ] Tone follows §3.2 (green / amber / red).
- [ ] **Default probability**
  - [ ] Matches the reference table in §3.3 within ±0.1pp for the listed scores.
  - [ ] Always inside `[0.5%, 25%]`.
  - [ ] Tone follows §3.3 thresholds.
- [ ] **Recommended action**
  - [ ] First-match-wins decision tree in §3.4 is enforced (covered by unit tests below).
  - [ ] When the current role's `approvalLimit` is lower than the loan amount, decided loans (`Approved`/`Rejected`) **don't** show "Escalate" — they show `"—"`.

---

## 6. Unit tests (suggested)

Add `lib/__tests__/analytics.test.ts`:

```ts
import { bucketScore, computePd, formatTimeBetween, recommendAction } from "../analytics";

describe("bucketScore", () => {
  test.each([
    [800, "Low"],
    [749, "Medium-Low"],
    [680, "Medium-Low"],
    [679, "Medium"],
    [620, "Medium"],
    [619, "Medium-High"],
    [559, "High"],
    [300, "High"],
  ])("score %i → %s", (s, b) => expect(bucketScore(s)).toBe(b));
});

describe("computePd", () => {
  test.each([
    [800, 1.8],
    [745, 3.7],
    [712, 4.9],
    [640, 7.4],
    [560, 10.2],
    [480, 13.1],
  ])("score %i → %f%", (s, expected) => expect(computePd(s)).toBeCloseTo(expected, 1));

  test("clamps at 0.5", () => expect(computePd(850)).toBe(0.5));
  test("clamps at 25",  () => expect(computePd(100)).toBe(25));
});

describe("formatTimeBetween", () => {
  test("missing decided",    () => expect(formatTimeBetween("Apr 21, 2026", undefined)).toBe("—"));
  test("hours",              () => expect(formatTimeBetween("Apr 21, 2026", "Apr 21, 2026")).toBe("0 hr"));
  test("days",               () => expect(formatTimeBetween("Apr 21, 2026", "Apr 23, 2026")).toBe("2.0 days"));
  test("weeks",              () => expect(formatTimeBetween("Apr 1, 2026",  "May 15, 2026")).toBe("6 weeks"));
  test("months",             () => expect(formatTimeBetween("Jan 1, 2026",  "Jun 1, 2026")).toBe("5 months"));
  test("garbage",            () => expect(formatTimeBetween("foo", "bar")).toBe("—"));
});

describe("recommendAction", () => {
  const base = { amount: 1000, limit: 50_000 } as const;
  test("decided loans → —", () =>
    expect(recommendAction({ ...base, status: "Approved", pd: 4, risk: "Low" }).label).toBe("—"));
  test("Reject on high PD", () =>
    expect(recommendAction({ ...base, status: "Progress", pd: 20, risk: "Medium" }).label).toBe("Reject"));
  test("Reject on High bucket regardless of PD", () =>
    expect(recommendAction({ ...base, status: "Progress", pd: 2, risk: "High" }).label).toBe("Reject"));
  test("Escalate when over limit", () =>
    expect(recommendAction({ status: "Progress", pd: 3, risk: "Low", amount: 60_000, limit: 50_000 }).label).toBe("Escalate"));
  test("Approve on the happy path", () =>
    expect(recommendAction({ ...base, status: "Progress", pd: 3, risk: "Low" }).label).toBe("Approve"));
  test("Review fallback", () =>
    expect(recommendAction({ ...base, status: "Progress", pd: 7, risk: "Medium" }).label).toBe("Review"));
});
```

---

## 7. Future fields (Phase 2 prerequisites)

These need to be added to `Application` (or fetched from a new endpoint) before the optional risk adjustments can be wired:

| Field | Type | Used by | Source |
|---|---|---|---|
| `dti` | `number` (0–100) | Risk rating, PD | computed = monthly loan installment ÷ monthly income |
| `priorDelinquency30d` | `boolean` | Risk rating, PD | from repayment history aggregate |
| `guarantorScore` | `number?` (300–850) | Risk rating, PD | already mocked on the Guarantor info tab |

When all three exist, swap `bucketScore` and `computePd` for versions that take them as a second arg.

---

## 8. Out of scope

- The real ML model for PD (Phase 3 — separate spec, separate team).
- Per-card drill-down modals.
- Historical charts (these belong on a separate Analytics dashboard, not the per-application tab).
- Time-series tracking of PD over the loan's life (originated PD vs current PD).

---

## 9. Rollout plan

| Phase | Scope | Dependencies |
|---|---|---|
| **Phase 1** | Cards 1, 2, 3, 4 wired to existing fields with formulas in this doc. | None — code change only. |
| **Phase 2** | Add DTI, prior delinquency, guarantor score adjustments per §3.2 and §3.3. | New fields on `Application` (or new endpoint). |
| **Phase 3** | Replace `computePd` with a calibrated ML model call. Cache result. | Risk model service. |

---

## 10. Quick sanity check against the screenshot

Sokha Chan, APP-10293, status `Progress`, score `712`, amount `$2,500`, role with `approvalLimit ≥ 50,000`:

| Card | Computed | Displayed in screenshot | Match? |
|---|---|---|---|
| Time to approval | `"—"` (still Progress) | `2.3 days` | ❌ today's hard-coded value |
| Risk rating | `Medium-Low` (score 712 ∈ [680, 749]) | `Medium-Low` | ✅ by coincidence |
| PD | `4.9%` | `4.2%` | ❌ today's hard-coded value |
| Recommended action | `Approve` (PD < 5, risk Med-Low, amount ≪ limit, in Progress) | `Approve` | ✅ |

After Phase 1 ships, the four numbers will track the underlying loan rather than being copy-pasted strings.
