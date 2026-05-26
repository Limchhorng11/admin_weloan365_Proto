export type ApplicationStatus = "Progress" | "Approved" | "Rejected";

export type RestructureRequest = {
  requestedAt: string;
  reason: string;
  requestedChange: string;
  phone: string;
};

export type Application = {
  id: string;
  cid: string;
  name: string;
  product: string;
  amount: number;
  term: number;      // months
  rate: number;      // % APR
  score: number;     // credit score
  branch: string;
  range: string;     // display value for list
  sent: string;
  officer: string;
  status: ApplicationStatus;
  /** Set when an approved loan's borrower has requested re-structure. */
  restructureRequest?: RestructureRequest;
};

export const APPLICATIONS: Application[] = [
  { id: "APP-10293", cid: "C-0421", name: "Sokha Chan",  product: "Personal",  amount: 2500,  term: 12, rate: 14.5, score: 712, branch: "Phnom Penh — Central",  range: "$2,500",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Progress" },
  {
    id: "APP-10231", cid: "C-0421", name: "Sokha Chan",  product: "Personal",  amount: 1500,  term: 6,  rate: 13.5, score: 712, branch: "Phnom Penh — Central",  range: "$1,500",  sent: "Nov 4, 2025",  officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-05-18",
      reason: "Repayment deadline overlaps with my term-end school fees. I'd like a slightly longer term so monthly amounts are easier.",
      requestedChange: "Extend term from 6 → 9 months; lower monthly installment to ~$175.",
      phone: "+855 12 345 678",
    },
  },
  { id: "APP-10294", cid: "C-0422", name: "Dara Meas",   product: "SME Micro", amount: 8000,  term: 18, rate: 16.0, score: 684, branch: "Siem Reap",             range: "$8,000",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Progress" },
  {
    id: "APP-10295", cid: "C-0424", name: "Pisey Ros",   product: "Auto",      amount: 15000, term: 36, rate: 11.5, score: 758, branch: "Battambang",            range: "$15,000", sent: "Apr 20, 2026", officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-04-23",
      reason: "Recent medical expenses have tightened my monthly cash flow. I'd like to lower my installment until the situation improves.",
      requestedChange: "Extend term from 36 → 48 months; reduce monthly payment to ~$380.",
      phone: "+855 96 221 004",
    },
  },
  { id: "APP-10296", cid: "C-0423", name: "Vichet Lim",  product: "Personal",  amount: 1200,  term: 6,  rate: 13.0, score: 745, branch: "Phnom Penh — Toul Kork",range: "$1,200",  sent: "Apr 19, 2026", officer: "Sophea K.",  status: "Progress" },
  { id: "APP-10297", cid: "C-0426", name: "Bopha Sok",   product: "Personal",  amount: 3000,  term: 12, rate: 14.5, score: 698, branch: "Kampong Cham",          range: "$3,000",  sent: "Apr 18, 2026", officer: "Unassigned", status: "Progress" },
  {
    id: "APP-10298", cid: "C-0427", name: "Rithy Pen",   product: "SME Micro", amount: 12000, term: 24, rate: 15.5, score: 720, branch: "Siem Reap",             range: "$12,000", sent: "Apr 17, 2026", officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-04-22",
      reason: "Business slow-down this quarter — need a temporary grace period before resuming full installments.",
      requestedChange: "3-month payment holiday, then resume at original schedule.",
      phone: "+855 92 118 006",
    },
  },
  { id: "APP-10299", cid: "C-0425", name: "Narith Kim",  product: "Agri",      amount: 4000,  term: 12, rate: 15.0, score: 640, branch: "Phnom Penh — Central",  range: "$4,000",  sent: "Apr 16, 2026", officer: "Laybun N.",  status: "Rejected" },
];

export const CHART_DATA: { label: string; value: number; highlight?: boolean }[] = [
  { label: "Jan", value: 42000 },
  { label: "Feb", value: 78000 },
  { label: "Mar", value: 56000 },
  { label: "Apr", value: 91000 },
  { label: "May", value: 48000 },
  { label: "Jun", value: 62000 },
  { label: "Jul", value: 55000 },
  { label: "Aug", value: 71000 },
  { label: "Sep", value: 38000 },
  { label: "Oct", value: 110100, highlight: true },
  { label: "Nov", value: 60000 },
  { label: "Dec", value: 47000 },
];

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  kyc: "verified" | "pending" | "rejected";
  loans: number;
  joined: string;
  branch: string;
};

export const CUSTOMERS: Customer[] = [
  { id: "C-0421", name: "Sokha Chan",   phone: "+855 12 345 678", email: "sokha@mail.com",  kyc: "verified", loans: 2, joined: "2023-06-11", branch: "Phnom Penh — Central" },
  { id: "C-0422", name: "Dara Meas",    phone: "+855 17 998 221", email: "dara@mail.com",   kyc: "verified", loans: 1, joined: "2024-01-03", branch: "Siem Reap" },
  { id: "C-0423", name: "Vichet Lim",   phone: "+855 10 556 777", email: "vichet@mail.com", kyc: "verified", loans: 1, joined: "2025-02-28", branch: "Phnom Penh — Toul Kork" },
  { id: "C-0424", name: "Pisey Ros",    phone: "+855 96 221 004", email: "pisey@mail.com",  kyc: "verified", loans: 1, joined: "2025-09-14", branch: "Battambang" },
  { id: "C-0425", name: "Narith Kim",   phone: "+855 88 330 112", email: "narith@mail.com", kyc: "pending",  loans: 1, joined: "2024-11-05", branch: "Phnom Penh — Central" },
  { id: "C-0426", name: "Bopha Sok",    phone: "+855 77 441 993", email: "bopha@mail.com",  kyc: "verified", loans: 1, joined: "2025-07-22", branch: "Kampong Cham" },
  { id: "C-0427", name: "Rithy Pen",    phone: "+855 92 118 006", email: "rithy@mail.com",  kyc: "verified", loans: 1, joined: "2024-04-17", branch: "Siem Reap" },
  { id: "C-0428", name: "Chenda Oum",   phone: "+855 86 772 554", email: "chenda@mail.com", kyc: "rejected", loans: 0, joined: "2026-04-17", branch: "Phnom Penh — Central" },
];

/**
 * Product kind:
 *   "non-mwl"    — standard retail loan (Personal, SME, Auto, Agri, Edu…)
 *   "mwl-parent" — Migrant Worker Loan family; not directly applied for
 *   "mwl-sub"    — country-specific variant under an MWL parent (KR/JP/SG)
 */
export type ProductKind = "non-mwl" | "mwl-parent" | "mwl-sub";

export type MwlCountry = "KR" | "JP" | "SG";

export const MWL_COUNTRIES: { code: MwlCountry; name: string; flag: string }[] = [
  { code: "KR", name: "Korea",     flag: "🇰🇷" },
  { code: "JP", name: "Japan",     flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

export type LoanProduct = {
  id: string;
  name: string;
  min: number;
  max: number;
  rateMin: number;
  rateMax: number;
  termMin: number;
  termMax: number;
  status: "active" | "draft";
  loans: number;
  /** Public-facing description (CMS body). Markdown-ish plain text. */
  description: string;
  /** Customer eligibility criteria (one per line). */
  eligibility: string;
  /** Documents the customer needs to provide (one per line). */
  requiredDocs: string;
  processingFee: number;   // % of disbursed amount
  latePenalty: number;     // % per month on overdue
  earlyPayoff: boolean;    // is early payoff allowed
  /** Product kind — defaults to "non-mwl" in legacy records. */
  kind?: ProductKind;
  /** For mwl-sub: which destination country this variant targets. */
  country?: MwlCountry;
  /** For mwl-sub: the parent's product id. */
  parentId?: string;
};

export const PRODUCTS: LoanProduct[] = [
  {
    id: "LP-01",
    name: "Personal Loan",
    min: 500, max: 5000,
    rateMin: 13.0, rateMax: 15.5,
    termMin: 6, termMax: 24,
    status: "active", loans: 412,
    description:
      "A flexible unsecured loan for personal needs — emergencies, education, " +
      "home improvement, or family events. No collateral required for qualified " +
      "applicants.",
    eligibility:
      "• Cambodian citizen or permanent resident\n" +
      "• Age between 21 and 60\n" +
      "• Minimum 6 months at current employer\n" +
      "• Monthly income at least $300",
    requiredDocs:
      "National ID\nPayslip (last 3 months)\nBank statement (last 6 months)\nUtility bill",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
  },
  {
    id: "LP-02",
    name: "SME Micro Loan",
    min: 2000, max: 25000,
    rateMin: 15.0, rateMax: 17.0,
    termMin: 6, termMax: 36,
    status: "active", loans: 198,
    description:
      "Working-capital and growth financing for small and medium enterprises. " +
      "Designed for businesses needing inventory, equipment, or short-term " +
      "operating funds.",
    eligibility:
      "• Business operating for at least 12 months\n" +
      "• Valid business license\n" +
      "• Monthly revenue at least $1,500\n" +
      "• Owner age between 25 and 65",
    requiredDocs:
      "National ID\nBusiness License\nBank statement (last 12 months)\nIncome tax filing",
    processingFee: 2.0,
    latePenalty: 2.5,
    earlyPayoff: true,
  },
  {
    id: "LP-03",
    name: "Auto Loan",
    min: 5000, max: 40000,
    rateMin: 10.5, rateMax: 12.5,
    termMin: 12, termMax: 60,
    status: "active", loans: 67,
    description:
      "Vehicle financing for new or pre-owned cars and motorcycles. " +
      "The vehicle title serves as collateral until the loan is fully repaid.",
    eligibility:
      "• Age 21 to 65\n" +
      "• Stable employment, minimum 1 year\n" +
      "• Down payment: at least 20% of vehicle price\n" +
      "• Valid driver's license",
    requiredDocs:
      "National ID\nDriver's license\nVehicle invoice/proforma\nPayslip (last 3 months)",
    processingFee: 1.0,
    latePenalty: 2.0,
    earlyPayoff: true,
  },
  {
    id: "LP-04",
    name: "Agri Loan",
    min: 1000, max: 8000,
    rateMin: 14.0, rateMax: 16.0,
    termMin: 6, termMax: 18,
    status: "active", loans: 89,
    description:
      "Seasonal financing for farmers — seeds, fertiliser, livestock, or " +
      "equipment. Flexible repayment aligned with harvest cycles.",
    eligibility:
      "• Active farmer or agricultural worker\n" +
      "• Proof of land ownership or lease\n" +
      "• Minimum 1 year of farming experience",
    requiredDocs:
      "National ID\nLand title or lease agreement\nFarming activity proof",
    processingFee: 1.5,
    latePenalty: 1.5,
    earlyPayoff: true,
  },
  {
    id: "LP-05",
    name: "Education Loan",
    min: 1500, max: 12000,
    rateMin: 9.5, rateMax: 11.0,
    termMin: 12, termMax: 48,
    status: "draft", loans: 0,
    description:
      "Affordable financing for tuition, textbooks, and living expenses. " +
      "Subsidised rate for students with strong academic standing.",
    eligibility:
      "• Enrolled in an accredited institution\n" +
      "• Co-signer required (parent or guardian)\n" +
      "• GPA 2.5 or higher",
    requiredDocs:
      "National ID\nProof of enrollment\nCo-signer documents\nAcademic transcript",
    processingFee: 0.5,
    latePenalty: 1.0,
    earlyPayoff: true,
  },

  /* ───────── MWL family — parent + country sub-products ───────── */
  {
    id: "LP-06",
    name: "Migrant Worker Loan",
    min: 500, max: 8000,
    rateMin: 12.0, rateMax: 14.0,
    termMin: 6, termMax: 36,
    status: "active", loans: 0,
    description:
      "Pre-departure financing for Cambodian workers heading overseas — " +
      "covers placement fees, visa, flight, training and settle-in costs. " +
      "Country-specific terms live as sub-products under this family.",
    eligibility:
      "• Cambodian citizen aged 18–55\n" +
      "• Signed overseas employment contract / MOU\n" +
      "• Valid passport (12+ months to expiry)\n" +
      "• Co-borrower or family guarantor in Cambodia",
    requiredDocs:
      "National ID\nPassport\nEmployment contract / MOU\nWork permit or visa\nMedical certificate",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
    kind: "mwl-parent",
  },
  {
    id: "LP-06-KR",
    name: "MWL — Korea (EPS)",
    min: 1000, max: 8000,
    rateMin: 12.0, rateMax: 13.5,
    termMin: 12, termMax: 36,
    status: "active", loans: 38,
    description:
      "MWL variant for workers placed under the Korean Employment Permit " +
      "System (EPS). Repayment aligned with the post-arrival KRW salary " +
      "cycle. Disbursement timed with departure.",
    eligibility:
      "• EPS placement or letter of selection\n" +
      "• Passed Korean language test (TOPIK / EPS-TOPIK)\n" +
      "• Co-borrower in Cambodia",
    requiredDocs:
      "National ID\nPassport\nEPS placement letter\nKorean language certificate\nMedical certificate",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
    kind: "mwl-sub",
    country: "KR",
    parentId: "LP-06",
  },
  {
    id: "LP-06-JP",
    name: "MWL — Japan (TITP / SSW)",
    min: 800, max: 7000,
    rateMin: 12.5, rateMax: 14.0,
    termMin: 12, termMax: 36,
    status: "active", loans: 21,
    description:
      "MWL variant for workers on Technical Intern Training (TITP) or " +
      "Specified Skilled Worker (SSW) visas. Covers JLPT certification, " +
      "placement fees, and pre-departure training.",
    eligibility:
      "• TITP / SSW placement letter\n" +
      "• JLPT N4 or higher (or SSW skill test pass)\n" +
      "• Co-borrower in Cambodia",
    requiredDocs:
      "National ID\nPassport\nTITP / SSW placement letter\nJLPT certificate\nMedical certificate",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
    kind: "mwl-sub",
    country: "JP",
    parentId: "LP-06",
  },
  {
    id: "LP-06-SG",
    name: "MWL — Singapore (WP)",
    min: 500, max: 5000,
    rateMin: 13.0, rateMax: 14.0,
    termMin: 6, termMax: 24,
    status: "draft", loans: 0,
    description:
      "MWL variant for workers on a Singapore Work Permit (WP). Smaller " +
      "ticket sizes reflect the shorter typical contract length and lower " +
      "placement-fee structure.",
    eligibility:
      "• In-Principle Approval (IPA) letter from MOM\n" +
      "• Confirmed employer & sector (construction / marine / process)\n" +
      "• Co-borrower in Cambodia",
    requiredDocs:
      "National ID\nPassport\nIPA letter\nEmployment offer\nMedical certificate",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
    kind: "mwl-sub",
    country: "SG",
    parentId: "LP-06",
  },
];

export const CONSULTATIONS = [
  {
    id: "RC-221",
    customer: "Sokha Chan",
    topic: "Personal loan options",
    requested: "2026-04-21 09:12",
    status: "open",
    officer: "Unassigned",
    // Structured intake from the customer mobile-app form
    preferredBranch: "Phnom Penh — Central",
    preferredDate: "May 26, 2026",
    preferredTime: "13:00",
    note: "I'm a teacher earning $480/mo and I'd like to compare ML and SBL for a small grocery shop.",
  },
  {
    id: "RC-220",
    customer: "Dara Meas",
    topic: "SME expansion financing",
    requested: "2026-04-20 14:03",
    status: "open",
    officer: "Laybun N.",
    preferredBranch: "Siem Reap",
    preferredDate: "May 27, 2026",
    preferredTime: "10:30",
    note: "Looking to expand my grocery shop into a second location near Wat Bo. Want to understand SME limits and what collateral is typically required.",
  },
  {
    id: "RC-219",
    customer: "Pisey Ros",
    topic: "Auto refinance rates",
    requested: "2026-04-19 11:45",
    status: "closed",
    officer: "Sophea K.",
    preferredBranch: "Battambang",
    preferredDate: "Apr 25, 2026",
    preferredTime: "09:00",
    note: "I have an existing auto loan from another bank (~$11,500 balance) and want to see if WeLoan can offer a lower rate.",
  },
  {
    id: "RC-218",
    customer: "Chenda Oum",
    topic: "First-time borrower",
    requested: "2026-04-18 16:20",
    status: "pending",
    officer: "Laybun N.",
    preferredBranch: "Phnom Penh — Central",
    preferredDate: "Apr 28, 2026",
    preferredTime: "14:30",
    note: "First-time applying for a loan — would like to know what documents I need to bring and how long the approval usually takes for a small personal loan.",
  },
];

export const FEEDBACK = [
  { id: "FB-028", customer: "Sokha Chan",  rating: 5, text: "Outstanding service, will recommend to family.",  date: "2026-04-21" },
  { id: "FB-027", customer: "Pisey Ros",   rating: 5, text: "Fast approval, friendly officer.",                date: "2026-04-20" },
  { id: "FB-026", customer: "Dara Meas",   rating: 4, text: "Process was clear but took a few extra days.",    date: "2026-04-19" },
  { id: "FB-025", customer: "Vichet Lim",  rating: 5, text: "Loved the new app — very easy to track payments.",date: "2026-04-19" },
  { id: "FB-024", customer: "Sokha Chan",  rating: 4, text: "Good experience overall.",                        date: "2026-04-18" },
  { id: "FB-023", customer: "Narith Kim",  rating: 2, text: "Rejection reason was not clear.",                 date: "2026-04-18" },
  { id: "FB-022", customer: "Bopha Sok",   rating: 5, text: "App is easy to use, payments smooth.",            date: "2026-04-17" },
  { id: "FB-021", customer: "Rithy Pen",   rating: 4, text: "Helpful staff, smooth disbursement.",             date: "2026-04-16" },
  { id: "FB-020", customer: "Chenda Oum",  rating: 3, text: "Average. Hoped for a faster response on chat.",   date: "2026-04-15" },
  { id: "FB-019", customer: "Pisey Ros",   rating: 5, text: "Excellent customer support.",                     date: "2026-04-12" },
  { id: "FB-018", customer: "Sokha Chan",  rating: 4, text: "Documents upload could be simpler.",              date: "2026-04-10" },
  { id: "FB-017", customer: "Vichet Lim",  rating: 5, text: "Quick KYC verification.",                         date: "2026-04-08" },
  { id: "FB-016", customer: "Dara Meas",   rating: 3, text: "Interest rate slightly higher than competitors.", date: "2026-04-05" },
  { id: "FB-015", customer: "Bopha Sok",   rating: 5, text: "Birthday discount was a nice touch!",             date: "2026-04-02" },
  { id: "FB-014", customer: "Narith Kim",  rating: 1, text: "Long wait time for review.",                      date: "2026-03-28" },
  { id: "FB-013", customer: "Rithy Pen",   rating: 4, text: "Smooth onboarding, branch staff were polite.",    date: "2026-03-25" },
  { id: "FB-012", customer: "Pisey Ros",   rating: 5, text: "ABA Pay integration works great.",                date: "2026-03-22" },
  { id: "FB-011", customer: "Vichet Lim",  rating: 4, text: "Push notifications are helpful reminders.",       date: "2026-03-18" },
  { id: "FB-010", customer: "Chenda Oum",  rating: 2, text: "App crashed twice while uploading documents.",    date: "2026-03-14" },
  { id: "FB-009", customer: "Sokha Chan",  rating: 5, text: "Best loan experience so far.",                    date: "2026-03-10" },
  { id: "FB-008", customer: "Dara Meas",   rating: 4, text: "Branch locator would be more useful with map.",   date: "2026-03-05" },
  { id: "FB-007", customer: "Bopha Sok",   rating: 3, text: "Statement download could include CSV format.",    date: "2026-02-28" },
  { id: "FB-006", customer: "Rithy Pen",   rating: 5, text: "Renewal was painless.",                           date: "2026-02-22" },
  { id: "FB-005", customer: "Pisey Ros",   rating: 4, text: "Khmer translation could be more natural.",        date: "2026-02-15" },
];

export const CHATS = [
  { id: "CH-88", customer: "Sokha Chan", last: "When will the loan be disbursed?",     unread: 2, at: "09:42" },
  { id: "CH-87", customer: "Pisey Ros",  last: "Thanks, received the confirmation!",   unread: 0, at: "08:11" },
  { id: "CH-86", customer: "Bopha Sok",  last: "I need to update my phone number.",    unread: 1, at: "Yday" },
  { id: "CH-85", customer: "Dara Meas",  last: "Can we reschedule next installment?",  unread: 0, at: "Mon" },
];

/* ====================================================================
   Blog Posts (CMS)
   All customer-app posts — categorised. Single editor handles everything.
   ==================================================================== */

export const POST_CATEGORIES = [
  { id: "blog",         label: "Blog",         tone: "blue"   },
  { id: "news",         label: "News",         tone: "violet" },
  { id: "announcement", label: "Announcement", tone: "amber"  },
  { id: "tips",         label: "Tips",         tone: "emerald"},
  { id: "promotion",    label: "Promotion",    tone: "rose"   },
] as const;

export type PostCategoryId = (typeof POST_CATEGORIES)[number]["id"];
export type PostStatus = "Published" | "Scheduled" | "Draft";

export type Post = {
  id: string;
  title: string;
  category: PostCategoryId;
  /** Body uses lightweight markdown (## headings, **bold**, *italic*, - lists). */
  body: string;
  /** Short summary shown in feed cards. */
  excerpt: string;
  /** Image URL or data: URL placeholder for the post's thumbnail. */
  thumbnail: string;
  author: string;
  status: PostStatus;
  /** Display date for the list (or "—" when not yet published / no schedule). */
  date: string;
  views: number;
};

export const POSTS: Post[] = [
  {
    id: "P-014",
    title: "5 tips before taking your first loan",
    category: "tips",
    excerpt: "Plan ahead, know your numbers, and pick the right product.",
    body:
      "## Plan ahead\nUnderstanding your monthly budget before applying makes the entire process smoother.\n\n## Know your numbers\nCheck your **debt-to-income ratio** — lenders look for under 40%.\n\n- Calculate your total monthly debt\n- Divide by your gross monthly income\n- Multiply by 100 to get the percentage\n\n## Pick the right product\nMatch the loan to the purpose — short term for emergencies, longer term for assets.",
    thumbnail: "",
    author: "Sophea K.",
    status: "Published",
    date: "2026-04-15",
    views: 1240,
  },
  {
    id: "P-013",
    title: "Khmer New Year holiday schedule",
    category: "announcement",
    excerpt: "All branches will be closed Apr 13–15. Mobile app remains available.",
    body:
      "All WeLoan365 branches will be **closed for Khmer New Year** from Apr 13 to Apr 15, 2026.\n\n- The mobile app remains fully available\n- Loan payments processed automatically continue\n- In-app chat will be staffed at reduced capacity\n\nWe wish all our customers a happy and prosperous new year!",
    thumbnail: "",
    author: "Admin",
    status: "Published",
    date: "2026-04-10",
    views: 3120,
  },
  {
    id: "P-012",
    title: "Understanding APR vs flat rate",
    category: "blog",
    excerpt: "What's the difference, and which is better for you?",
    body:
      "APR (Annual Percentage Rate) is the **true cost** of a loan, expressed as a yearly rate.\n\nFlat rate looks simpler but can be deceiving — the actual cost is usually higher than the headline number.\n\n## Quick comparison\n- *Flat 10% × 1 year* ≈ APR of ~18%\n- Always compare loans using APR\n\nAsk your loan officer to walk through both numbers before you sign.",
    thumbnail: "",
    author: "Laybun N.",
    status: "Published",
    date: "2026-04-08",
    views: 890,
  },
  {
    id: "P-011",
    title: "New Education Loan launching soon",
    category: "news",
    excerpt: "Subsidised rate for university and vocational students. Launching May 1.",
    body:
      "We're launching the **Education Loan** product on May 1, 2026.\n\nKey features:\n- Rate from **9.5% APR**\n- Term up to 48 months\n- Co-signer required\n\nVisit any branch from May 1 to apply.",
    thumbnail: "",
    author: "Admin",
    status: "Scheduled",
    date: "2026-04-25",
    views: 0,
  },
  {
    id: "P-010",
    title: "Branch hours update — Siem Reap",
    category: "announcement",
    excerpt: "Extended Saturday hours starting April.",
    body:
      "The Siem Reap branch will now be open on **Saturdays** from 8:00 AM to 1:00 PM, in addition to weekday hours.\n\nNo appointment required — walk-ins welcome.",
    thumbnail: "",
    author: "Ratanak L.",
    status: "Published",
    date: "2026-04-02",
    views: 542,
  },
  {
    id: "P-009",
    title: "Birthday rate discount — limited time",
    category: "promotion",
    excerpt: "Customers get 0.5% off on new loans during their birthday month.",
    body:
      "🎂 Celebrate your birthday with us — get **0.5% off** your APR on any new loan, valid for the entire month of your birthday.\n\n- Available on Personal, SME Micro, and Auto loans\n- Stack with referral rewards\n- Apply in-app or at any branch",
    thumbnail: "",
    author: "Sophea K.",
    status: "Draft",
    date: "—",
    views: 0,
  },
  {
    id: "P-008",
    title: "How to improve your credit score",
    category: "tips",
    excerpt: "Small habits that move your score in the right direction.",
    body:
      "Improving your credit score takes time, but a few habits compound quickly:\n\n## Pay on time\nThis is the single biggest factor.\n\n## Keep utilisation low\nUse less than 30% of available credit on any line.\n\n## Avoid opening too many accounts at once\nEach hard inquiry costs you a few points.",
    thumbnail: "",
    author: "Sophea K.",
    status: "Draft",
    date: "—",
    views: 0,
  },
];

export const USERS = [
  { id: "U-01", name: "Laybun N.",    email: "laybunnavitou@kosign.com.kh", role: "Credit Officer",        branch: "Phnom Penh",  status: "Active",   lastActive: "2 min ago" },
  { id: "U-02", name: "Sophea K.",    email: "sophea.k@kosign.com.kh",      role: "Senior Credit Officer", branch: "Siem Reap",   status: "Active",   lastActive: "1 hr ago"  },
  { id: "U-03", name: "Ratanak L.",   email: "ratanak.l@kosign.com.kh",     role: "Branch Manager",        branch: "Battambang",  status: "Active",   lastActive: "Today"     },
  { id: "U-04", name: "Sreyneang P.", email: "sreyneang.p@kosign.com.kh",   role: "Compliance",            branch: "HQ",          status: "Active",   lastActive: "Today"     },
  { id: "U-05", name: "Kosal M.",     email: "kosal.m@kosign.com.kh",       role: "Admin",                 branch: "HQ",          status: "Inactive", lastActive: "30 d ago"  },
  { id: "U-06", name: "Pisey C.",     email: "pisey.c@kosign.com.kh",       role: "Cashier",               branch: "Phnom Penh",  status: "Active",   lastActive: "10 min ago"},
  { id: "U-07", name: "Mengsrun H.",  email: "mengsrun.h@kosign.com.kh",    role: "Approval Committee",    branch: "HQ",          status: "Active",   lastActive: "Yesterday" },
];

/* ====================================================================
   ROLES & PERMISSIONS
   ==================================================================== */

export type Permission = {
  key: string;
  label: string;
  category: PermissionCategory;
  /** sensitive permissions are highlighted in the UI */
  sensitive?: boolean;
};

export type PermissionCategory =
  | "Customer"
  | "Loan Application"
  | "Disbursement & Repayment"
  | "Loan Portfolio"
  | "Reports"
  | "User & Role"
  | "Branch"
  | "Settings"
  | "Audit";

export const PERMISSIONS: Permission[] = [
  { key: "customer.view",     label: "View customers",         category: "Customer" },
  { key: "customer.create",   label: "Create customer",        category: "Customer" },
  { key: "customer.edit",     label: "Edit customer profile",  category: "Customer" },
  { key: "customer.kyc",      label: "Run KYC / CBC",          category: "Customer" },

  { key: "loan.view",         label: "View applications",      category: "Loan Application" },
  { key: "loan.create",       label: "Create application",     category: "Loan Application" },
  { key: "loan.review",       label: "Review application",     category: "Loan Application" },
  { key: "loan.approve",      label: "Approve application",    category: "Loan Application", sensitive: true },
  { key: "loan.reject",       label: "Reject application",     category: "Loan Application" },

  { key: "disburse.execute",  label: "Disburse loan",          category: "Disbursement & Repayment", sensitive: true },
  { key: "disburse.reverse",  label: "Reverse disbursement",   category: "Disbursement & Repayment", sensitive: true },
  { key: "payment.record",    label: "Record repayment",       category: "Disbursement & Repayment" },
  { key: "payment.view",      label: "View payment history",   category: "Disbursement & Repayment" },
  { key: "payment.reverse",   label: "Reverse payment",        category: "Disbursement & Repayment", sensitive: true },

  { key: "portfolio.view",        label: "View loan portfolio",        category: "Loan Portfolio" },
  { key: "portfolio.restructure", label: "Restructure loan",           category: "Loan Portfolio", sensitive: true },
  { key: "portfolio.writeoff",    label: "Write-off loan",             category: "Loan Portfolio", sensitive: true },

  { key: "report.view",   label: "View reports",   category: "Reports" },
  { key: "report.export", label: "Export reports", category: "Reports" },

  { key: "user.view",   label: "View staff users", category: "User & Role" },
  { key: "user.create", label: "Create user",      category: "User & Role" },
  { key: "user.edit",   label: "Edit user",        category: "User & Role" },
  { key: "role.edit",   label: "Manage roles & permissions", category: "User & Role", sensitive: true },

  { key: "branch.phnom_penh",    label: "Phnom Penh",    category: "Branch" },
  { key: "branch.siem_reap",     label: "Siem Reap",     category: "Branch" },
  { key: "branch.battambang",    label: "Battambang",    category: "Branch" },
  { key: "branch.kompong_cham",  label: "Kompong Cham",  category: "Branch" },

  { key: "setting.view", label: "View settings", category: "Settings" },
  { key: "setting.edit", label: "Edit settings", category: "Settings", sensitive: true },

  { key: "audit.view",   label: "View audit log",   category: "Audit" },
  { key: "audit.export", label: "Export audit log", category: "Audit" },
];

export type Role = {
  key: string;
  name: string;
  description: string;
  /** maximum loan amount this role can approve. null = unlimited, 0 = cannot approve */
  approvalLimit: number | null;
  /** "*" means all permissions */
  permissions: string[] | "*";
  userCount: number;
  /** system roles cannot be deleted, only the Admin role can edit them */
  isSystem: boolean;
};

export const ROLES: Role[] = [
  {
    key: "admin",
    name: "Admin",
    description: "Full system access. Can manage users, roles, and all settings.",
    approvalLimit: null,
    permissions: "*",
    userCount: 1,
    isSystem: true,
  },
  {
    key: "branch_manager",
    name: "Branch Manager",
    description: "Manage branch operations and approve mid-tier loans.",
    approvalLimit: 50000,
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review", "loan.approve", "loan.reject",
      "disburse.execute",
      "payment.view", "payment.record",
      "portfolio.view", "portfolio.restructure",
      "report.view", "report.export",
      "user.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
      "audit.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "senior_co",
    name: "Senior Credit Officer",
    description: "Senior loan origination with first-tier approval authority.",
    approvalLimit: 10000,
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review", "loan.approve", "loan.reject",
      "payment.view",
      "portfolio.view",
      "report.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "co",
    name: "Credit Officer",
    description: "Originate and review loan applications. Cannot approve.",
    approvalLimit: 0,
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review",
      "payment.view",
      "portfolio.view",
      "report.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "approval",
    name: "Approval Committee",
    description: "Final-tier approval for high-value loans. View-only on operations.",
    approvalLimit: null,
    permissions: [
      "customer.view",
      "loan.view", "loan.approve", "loan.reject",
      "portfolio.view",
      "report.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
      "audit.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "cashier",
    name: "Cashier",
    description: "Disburse approved loans and record customer repayments. Does not handle loan applications.",
    approvalLimit: 0,
    permissions: [
      "customer.view",
      "disburse.execute",
      "payment.record", "payment.view",
      "portfolio.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "compliance",
    name: "Compliance",
    description: "Read-only access to all data for audit and regulatory reporting.",
    approvalLimit: 0,
    permissions: [
      "customer.view",
      "loan.view",
      "payment.view",
      "portfolio.view",
      "report.view", "report.export",
      "user.view",
      "branch.phnom_penh", "branch.siem_reap", "branch.battambang", "branch.kompong_cham",
      "audit.view", "audit.export",
    ],
    userCount: 1,
    isSystem: true,
  },
];

/* ---------- Approval layers (multi-tier loan approval workflow) ---------- */

export type ApprovalLayer = {
  level: number;
  name: string;
  role: string;
  /** layer activates when loan amount > min */
  min: number;
  /** layer's max approval amount; null = unlimited */
  max: number | null;
  description: string;
};

export const APPROVAL_LAYERS: ApprovalLayer[] = [
  { level: 1, name: "Credit Officer Review",     role: "Credit Officer",        min: 0,     max: null,   description: "Initial review, KYC verification, and credit assessment. Always required." },
  { level: 2, name: "Senior Officer Approval",   role: "Senior Credit Officer", min: 2000,  max: 10000,  description: "Required for loans above $2,000." },
  { level: 3, name: "Branch Manager Approval",   role: "Branch Manager",        min: 10000, max: 50000,  description: "Required for loans above $10,000." },
  { level: 4, name: "Loan Committee Approval",   role: "Approval Committee",    min: 50000, max: null,   description: "Required for loans above $50,000." },
];

export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
};

export const BRANCHES: Branch[] = [
  { id: "BR-01", name: "Phnom Penh — Central",   address: "#123, St. 271, Sangkat BKK1", phone: "+855 23 900 001", lat: 11.5564, lng: 104.9282 },
  { id: "BR-02", name: "Phnom Penh — Toul Kork", address: "#56, St. 289, Toul Kork",     phone: "+855 23 900 002", lat: 11.5701, lng: 104.8910 },
  { id: "BR-03", name: "Siem Reap",              address: "#12, Wat Bo Road",            phone: "+855 63 900 003", lat: 13.3633, lng: 103.8564 },
  { id: "BR-04", name: "Battambang",             address: "#78, St. 3, Svay Por",        phone: "+855 53 900 004", lat: 13.0950, lng: 103.2025 },
  { id: "BR-05", name: "Kampong Cham",           address: "#10, Preah Monivong Blvd",    phone: "+855 42 900 005", lat: 11.9971, lng: 105.4595 },
];
