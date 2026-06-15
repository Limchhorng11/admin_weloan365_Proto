export type ApplicationStatus = "Progress" | "Approved" | "Rejected";

export type RestructureRequest = {
  requestedAt: string;
  reason: string;
  requestedChange: string;
  phone: string;
  /** Officer's verdict on the request.
   *   "pending"  — submitted, awaiting decision (default for new requests)
   *   "approved" — accepted
   *   "declined" — rejected (renders as "Re-structure request failed") */
  decision?: "pending" | "approved" | "declined";
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
  { id: "APP-10293", cid: "C-0421", name: "Sokha Chan",  product: "Micro Loan (ML)",  amount: 2500,  term: 12, rate: 14.5, score: 712, branch: "Phnom Penh — Central",  range: "$2,500",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Progress" },
  {
    id: "APP-10231", cid: "C-0421", name: "Sokha Chan",  product: "Micro Loan (ML)",  amount: 1500,  term: 6,  rate: 13.5, score: 712, branch: "Phnom Penh — Central",  range: "$1,500",  sent: "Nov 4, 2025",  officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-05-18",
      reason: "Repayment deadline overlaps with my term-end school fees. I'd like a slightly longer term so monthly amounts are easier.",
      requestedChange: "Extend term from 6 → 9 months; lower monthly installment to ~$175.",
      phone: "+855 12 345 678",
    },
  },
  { id: "APP-10294", cid: "C-0422", name: "Dara Meas",   product: "Small Business Loan (SBL)", amount: 8000,  term: 18, rate: 16.0, score: 684, branch: "Siem Reap",             range: "$8,000",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Progress" },
  {
    id: "APP-10295", cid: "C-0424", name: "Pisey Ros",   product: "Small & Medium Enterprise (SME)", amount: 15000, term: 36, rate: 11.5, score: 758, branch: "Battambang",            range: "$15,000", sent: "Apr 20, 2026", officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-04-23",
      reason: "Recent medical expenses have tightened my monthly cash flow. I'd like to lower my installment until the situation improves.",
      requestedChange: "Extend term from 36 → 48 months; reduce monthly payment to ~$380.",
      phone: "+855 96 221 004",
    },
  },
  { id: "APP-10296", cid: "C-0423", name: "Vichet Lim",  product: "Micro Loan (ML)",  amount: 1200,  term: 6,  rate: 13.0, score: 745, branch: "Phnom Penh — Toul Kork",range: "$1,200",  sent: "Apr 19, 2026", officer: "Sophea K.",  status: "Progress" },
  { id: "APP-10297", cid: "C-0426", name: "Bopha Sok",   product: "Micro Loan (ML)",  amount: 3000,  term: 12, rate: 14.5, score: 698, branch: "Kampong Cham",          range: "$3,000",  sent: "Apr 18, 2026", officer: "Unassigned", status: "Progress" },
  {
    id: "APP-10298", cid: "C-0427", name: "Rithy Pen",   product: "Small Business Loan (SBL)", amount: 12000, term: 24, rate: 15.5, score: 720, branch: "Siem Reap",             range: "$12,000", sent: "Apr 17, 2026", officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-04-22",
      reason: "Business slow-down this quarter — need a temporary grace period before resuming full installments.",
      requestedChange: "3-month payment holiday, then resume at original schedule.",
      phone: "+855 92 118 006",
      decision: "declined",
    },
  },
  { id: "APP-10299", cid: "C-0425", name: "Narith Kim",  product: "Micro Loan (ML)",  amount: 4000,  term: 12, rate: 15.0, score: 640, branch: "Phnom Penh — Central",  range: "$4,000",  sent: "Apr 16, 2026", officer: "Laybun N.",  status: "Rejected" },
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

export type CustomerDevice = {
  /** Device platform — used for the small icon in the list column. */
  platform: "ios" | "android";
  /** Marketed model name shown in the table (e.g. "iPhone 14", "Galaxy A53"). */
  model: string;
  /** Free-form label shown under the model in the customer detail page. */
  os?: string;
  /** Last time the customer used the mobile app from this device. */
  lastSeen?: string;
};

/** Structured profile captured in the customer mobile app, grouped by type. */
export type CustomerProfile = {
  /** Residential address (Cambodia administrative hierarchy). */
  address: {
    cityProvince: string;
    district: string;
    commune: string;
    village: string;
    houseStreet: string;
  };
  /** Employment / income details. */
  employment: {
    type: string;
    companyName: string;
    businessType: string;
    businessNature: string;
    incomeSource: string;
    incomeRange: string;
  };
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  kyc: "verified" | "pending" | "rejected";
  loans: number;
  joined: string;
  branch: string;
  /** Personal / KYC information — shared by the customer detail page and the
   *  loan application detail page so both show identical data for the customer. */
  nationalId: string;
  dob: string;
  address: string;
  occupation: string;
  monthlyIncome: number;
  bankAccount: string;
  /** Marital status captured on the customer's loan-application form. */
  maritalStatus: string;
  /** Full mobile-app profile, grouped by type (address + employment). */
  profile: CustomerProfile;
  /** Devices the customer has signed in from. The first entry is the primary
   *  (most recently used) device — that's what the list view surfaces. */
  devices: CustomerDevice[];
  /** Account lifecycle status.
   *   "active"    — normal customer (default when omitted)
   *   "suspended" — customer deleted their account from the mobile app; the
   *                 record stays for compliance / loan history but no admin
   *                 actions (Reset PIN, etc.) are available on it. */
  accountStatus?: "active" | "suspended";
  /** ISO date (YYYY-MM-DD) when the customer self-deleted their account.
   *  Only set when `accountStatus === "suspended"`. */
  deletedAt?: string;
};

export const CUSTOMERS: Customer[] = [
  {
    id: "C-0421", name: "Sokha Chan",   phone: "+855 12 345 678", email: "sokha@mail.com",  kyc: "verified", loans: 2, joined: "2023-06-11", branch: "Phnom Penh — Central",
    nationalId: "200112 ••• 4521", dob: "1993-08-12", address: "#123, St. 271, Sangkat BKK1, Phnom Penh", occupation: "Retail supervisor", monthlyIncome: 850, bankAccount: "ABA •••• 1284", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Chamkarmon", commune: "Sangkat BKK 1", village: "Phum 1", houseStreet: "No. 123 · St. 271" },
      employment: { type: "Employed", companyName: "Lucky Supermarket", businessType: "Retail Trade", businessNature: "Supermarket", incomeSource: "Salary", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "ios",     model: "iPhone 14",            os: "iOS 17.4",    lastSeen: "2 min ago"  },
      { platform: "android", model: "Galaxy Tab A8",        os: "Android 13",  lastSeen: "12 days ago" },
    ],
  },
  {
    id: "C-0422", name: "Dara Meas",    phone: "+855 17 998 221", email: "dara@mail.com",   kyc: "verified", loans: 1, joined: "2024-01-03", branch: "Siem Reap",
    nationalId: "200456 ••• 7782", dob: "1990-03-25", address: "#45, Wat Bo Road, Siem Reap", occupation: "Shop owner", monthlyIncome: 1200, bankAccount: "ACLEDA •••• 9921", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Siem Reap", district: "Krong Siem Reap", commune: "Sangkat Sala Kamreuk", village: "Phum Wat Bo", houseStreet: "No. 45 · Wat Bo Road" },
      employment: { type: "Self-employed", companyName: "Dara Grocery", businessType: "Retail Trade", businessNature: "Grocery & General Goods", incomeSource: "Business Revenue", incomeRange: "$1,000 – $1,500 / month" },
    },
    devices: [
      { platform: "android", model: "Samsung Galaxy A53",   os: "Android 14",  lastSeen: "1 hr ago"   },
    ],
  },
  {
    id: "C-0423", name: "Vichet Lim",   phone: "+855 10 556 777", email: "vichet@mail.com", kyc: "verified", loans: 1, joined: "2025-02-28", branch: "Phnom Penh — Toul Kork",
    nationalId: "199823 ••• 1190", dob: "1995-11-02", address: "#56, St. 289, Toul Kork, Phnom Penh", occupation: "Delivery driver", monthlyIncome: 700, bankAccount: "Wing •••• 3345", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Toul Kork", commune: "Sangkat Boeung Kak 1", village: "Phum 5", houseStreet: "No. 56 · St. 289" },
      employment: { type: "Employed", companyName: "Nham24", businessType: "Logistics & Delivery", businessNature: "Food Delivery", incomeSource: "Salary", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "android", model: "Huawei P50",           os: "HarmonyOS 3", lastSeen: "Yesterday"  },
    ],
  },
  // Row 4 — Chenda self-deleted her account from the mobile app on 2026-04-26.
  // We keep the record (compliance + audit) but the row reads as muted in the UI
  // and admin actions like Reset PIN are disabled.
  {
    id: "C-0428", name: "Chenda Oum",   phone: "+855 86 772 554", email: "chenda@mail.com", kyc: "rejected", loans: 0, joined: "2026-04-17", branch: "Phnom Penh — Central",
    nationalId: "200298 ••• 6620", dob: "1998-05-19", address: "#9, St. 105, Phnom Penh", occupation: "Student", monthlyIncome: 0, bankAccount: "—", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Daun Penh", commune: "Sangkat Wat Phnom", village: "Phum 2", houseStreet: "No. 9 · St. 105" },
      employment: { type: "Student", companyName: "—", businessType: "—", businessNature: "—", incomeSource: "Family Support", incomeRange: "Under $500 / month" },
    },
    devices: [
      { platform: "ios",     model: "iPhone SE",            os: "iOS 17.4",    lastSeen: "Yesterday"  },
    ],
    accountStatus: "suspended",
    deletedAt: "2026-04-26",
  },
  {
    id: "C-0424", name: "Pisey Ros",    phone: "+855 96 221 004", email: "pisey@mail.com",  kyc: "verified", loans: 1, joined: "2025-09-14", branch: "Battambang",
    nationalId: "199567 ••• 4410", dob: "1992-07-30", address: "#78, St. 3, Svay Por, Battambang", occupation: "Teacher", monthlyIncome: 950, bankAccount: "ABA •••• 5567", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Battambang", district: "Krong Battambang", commune: "Sangkat Svay Por", village: "Phum 3", houseStreet: "No. 78 · St. 3" },
      employment: { type: "Employed", companyName: "Battambang High School", businessType: "Education", businessNature: "Public School", incomeSource: "Salary", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "ios",     model: "iPhone 13 Pro",        os: "iOS 17.3",    lastSeen: "3 hr ago"   },
    ],
  },
  {
    id: "C-0425", name: "Narith Kim",   phone: "+855 88 330 112", email: "narith@mail.com", kyc: "pending",  loans: 1, joined: "2024-11-05", branch: "Phnom Penh — Central",
    nationalId: "200034 ••• 8810", dob: "1994-01-15", address: "#212, St. 271, Phnom Penh", occupation: "Factory worker", monthlyIncome: 600, bankAccount: "ACLEDA •••• 2210", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Chamkarmon", commune: "Sangkat Tonle Bassac", village: "Phum 4", houseStreet: "No. 212 · St. 271" },
      employment: { type: "Employed", companyName: "Grand Twins Garment", businessType: "Manufacturing", businessNature: "Garment Factory", incomeSource: "Salary", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "android", model: "Xiaomi Redmi Note 12", os: "MIUI 14",     lastSeen: "5 days ago" },
    ],
  },
  {
    id: "C-0426", name: "Bopha Sok",    phone: "+855 77 441 993", email: "bopha@mail.com",  kyc: "verified", loans: 1, joined: "2025-07-22", branch: "Kampong Cham",
    nationalId: "199789 ••• 3301", dob: "1991-09-08", address: "#10, Preah Monivong Blvd, Kampong Cham", occupation: "Market vendor", monthlyIncome: 800, bankAccount: "Wing •••• 7788", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Kampong Cham", district: "Krong Kampong Cham", commune: "Sangkat Kampong Cham", village: "Phum 1", houseStreet: "No. 10 · Preah Monivong Blvd" },
      employment: { type: "Self-employed", companyName: "Bopha Stall", businessType: "Retail Trade", businessNature: "Fresh Market Vendor", incomeSource: "Business Revenue", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "android", model: "Samsung Galaxy S22",   os: "Android 14",  lastSeen: "30 min ago" },
    ],
  },
  {
    id: "C-0427", name: "Rithy Pen",    phone: "+855 92 118 006", email: "rithy@mail.com",  kyc: "verified", loans: 1, joined: "2024-04-17", branch: "Siem Reap",
    nationalId: "199345 ••• 5567", dob: "1989-12-21", address: "#33, Wat Bo Road, Siem Reap", occupation: "Tour guide", monthlyIncome: 1100, bankAccount: "ABA •••• 4456", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Siem Reap", district: "Krong Siem Reap", commune: "Sangkat Svay Dangkum", village: "Phum Wat Bo", houseStreet: "No. 33 · Wat Bo Road" },
      employment: { type: "Self-employed", companyName: "Angkor Smile Tours", businessType: "Tourism", businessNature: "Tour Services", incomeSource: "Business Revenue", incomeRange: "$1,000 – $1,500 / month" },
    },
    devices: [
      { platform: "android", model: "Oppo A77",             os: "ColorOS 12",  lastSeen: "1 day ago"  },
      { platform: "ios",     model: "iPhone SE (2nd gen)",  os: "iOS 16.7",    lastSeen: "2 months ago" },
    ],
  },
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

/** Common overseas-destination name → ISO 3166-1 alpha-2 code lookup.
 *  Used to auto-derive the short "KR / JP / SG"-style badge for new MWL
 *  sub-products from a free-form country name typed by an admin. */
const ISO_BY_NAME: Record<string, string> = {
  // East / Southeast Asia
  KOREA: "KR", "SOUTH KOREA": "KR", "REPUBLIC OF KOREA": "KR",
  JAPAN: "JP",
  SINGAPORE: "SG",
  MALAYSIA: "MY",
  THAILAND: "TH",
  VIETNAM: "VN", "VIET NAM": "VN",
  INDONESIA: "ID",
  CHINA: "CN",
  "HONG KONG": "HK",
  TAIWAN: "TW",
  PHILIPPINES: "PH",
  BRUNEI: "BN",
  LAOS: "LA",
  MYANMAR: "MM",
  // South Asia
  INDIA: "IN",
  PAKISTAN: "PK",
  BANGLADESH: "BD",
  "SRI LANKA": "LK",
  NEPAL: "NP",
  // Oceania
  AUSTRALIA: "AU",
  "NEW ZEALAND": "NZ",
  // Middle East
  "SAUDI ARABIA": "SA",
  UAE: "AE", "UNITED ARAB EMIRATES": "AE",
  QATAR: "QA",
  KUWAIT: "KW",
  BAHRAIN: "BH",
  OMAN: "OM",
  JORDAN: "JO",
  ISRAEL: "IL",
  LEBANON: "LB",
  IRAQ: "IQ",
  IRAN: "IR",
  YEMEN: "YE",
  // Europe / Americas (common overseas-worker destinations)
  USA: "US", "UNITED STATES": "US", AMERICA: "US",
  CANADA: "CA",
  UK: "GB", "UNITED KINGDOM": "GB", BRITAIN: "GB", ENGLAND: "GB",
  FRANCE: "FR",
  GERMANY: "DE",
  ITALY: "IT",
  SPAIN: "ES",
  PORTUGAL: "PT",
  NETHERLANDS: "NL", HOLLAND: "NL",
  BELGIUM: "BE",
  SWEDEN: "SE",
  NORWAY: "NO",
  DENMARK: "DK",
  FINLAND: "FI",
  RUSSIA: "RU",
};

/** Given a free-form country name, return a 2-character uppercase code that
 *  matches the existing "KR / JP / SG" badge convention.
 *  Falls back to the first two letters of the input when the name is unknown. */
export function countryCodeFor(name: string): string {
  const key = name.trim().toUpperCase();
  if (!key) return "??";
  if (ISO_BY_NAME[key]) return ISO_BY_NAME[key];
  // Fallback: first two A–Z letters of the input (e.g. "Arab" → "AR").
  const letters = key.replace(/[^A-Z]/g, "").slice(0, 2);
  return letters.length === 2 ? letters : (letters + "X").slice(0, 2);
}

export type LoanProductStatus = "active" | "inactive" | "draft";

export type LoanProduct = {
  id: string;
  name: string;
  min: number;
  max: number;
  rateMin: number;
  rateMax: number;
  termMin: number;
  termMax: number;
  status: LoanProductStatus;
  loans: number;
  /** Public-facing description (CMS body). Markdown-ish plain text. */
  description: string;
  /** Customer eligibility criteria (one per line). */
  eligibility: string;
  /** Documents the customer needs to provide (one per line).
   *  Repurposed as "Benefits" in newer forms — kept under this key for
   *  backwards compatibility with seeded data. */
  requiredDocs: string;
  processingFee: number;   // % of disbursed amount
  latePenalty: number;     // % per month on overdue
  earlyPayoff: boolean;    // is early payoff allowed
  /** Repayment method (e.g. "Flexible", "Periodic principal and interest"). */
  repaymentMethod?: string;
  /** Product kind — defaults to "non-mwl" in legacy records. */
  kind?: ProductKind;
  /** For mwl-sub: destination country. May be a legacy MWL_COUNTRIES code
   *  (KR / JP / SG → flag lookup works) or a free-form name added by admins. */
  country?: string;
  /** For mwl-sub: the parent's product id. */
  parentId?: string;
  /** Optional product media — an uploaded image or video (data URL in the prototype). */
  media?: string;
  mediaType?: "image" | "video";
  /** Structured required documents with an optional caption + uploaded icon
   *  (data URL). `requiredDocs` above is kept as the newline-joined names for
   *  backward compatibility. */
  requiredDocuments?: { name: string; note?: string; icon?: string }[];
};

export const PRODUCTS: LoanProduct[] = [
  /* ───────── NHFC product catalogue (per reference sheet) ───────── */
  {
    id: "LP-07",
    name: "Micro Loan (ML)",
    min: 100, max: 3000,
    rateMin: 14.0, rateMax: 18.0,
    termMin: 6, termMax: 48,
    status: "active", loans: 0,
    description:
      "Micro Loan (ML) is designed to support low-income people in rural and urban " +
      "areas through micro / small businesses and agricultural activities, offered " +
      "in both Khmer Riel and US Dollars.",
    eligibility:
      "• Age 18 to 65 years old\n" +
      "• Permanent residential address at NHFC's operating area\n" +
      "• Stable and verifiable income source\n" +
      "• Hard or soft title collateral",
    requiredDocs:
      "National ID\nFamily / residence book\nProof of income / business activity\nLand title (soft or hard)",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
  },
  {
    id: "LP-08",
    name: "Small Business Loan (SBL)",
    min: 1000, max: 30000,
    rateMin: 12.0, rateMax: 16.0,
    termMin: 6, termMax: 96,
    status: "active", loans: 0,
    description:
      "Small Business Loan (SBL) supports clients in starting or expanding micro / " +
      "small businesses for improved profitability and sustainable growth. Provided " +
      "to clients in both rural and urban areas, offered in US Dollars and Khmer Riel.",
    eligibility:
      "• Age 18 to 65 years old\n" +
      "• Permanent residential address at NHFC's operating area\n" +
      "• Stable and verifiable income source\n" +
      "• Hard or soft title collateral",
    requiredDocs:
      "National ID\nBusiness license / activity proof\nBank statement (last 12 months)\nLand title (soft or hard)",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
  },
  {
    id: "LP-09",
    name: "Small & Medium Enterprise (SME)",
    min: 5000, max: 100000,
    rateMin: 11.0, rateMax: 15.0,
    termMin: 6, termMax: 120,
    status: "active", loans: 0,
    description:
      "SME Loan supports existing and new clients or entrepreneurs in establishing " +
      "new businesses or expanding existing ones, offered in both US Dollars and " +
      "Khmer Riel.",
    eligibility:
      "• Age 18 to 65 years old\n" +
      "• Permanent residential address at NHFC's operating area\n" +
      "• Stable and verifiable income source\n" +
      "• Hard or soft title collateral",
    requiredDocs:
      "National ID\nBusiness license & financials\nBank statement (last 12 months)\nLand title (soft or hard)",
    processingFee: 1.5,
    latePenalty: 2.0,
    earlyPayoff: true,
  },
  {
    id: "LP-10",
    name: "Housing Loan (HL)",
    min: 10000, max: 300000,
    rateMin: 9.0, rateMax: 13.0,
    termMin: 12, termMax: 240,
    status: "active", loans: 0,
    description:
      "Housing Loan (HL) supports affordable housing in response to population growth " +
      "and real-estate market demand. A long-term loan provided for house purchase, " +
      "offered in both US Dollars and Khmer Riel.",
    eligibility:
      "• Age 18 to 65 years old\n" +
      "• Permanent residential address at NHFC's operating area\n" +
      "• Stable and verifiable income source\n" +
      "• Hard or soft title collateral",
    requiredDocs:
      "National ID\nProof of income\nProperty sale & purchase agreement\nLand title (soft or hard)",
    processingFee: 1.0,
    latePenalty: 2.0,
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
    name: "MWL — Korea",
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
    name: "MWL — Japan",
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
    name: "MWL — Singapore",
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
    topic: "Micro Loan options",
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
    topic: "Housing Loan inquiry",
    requested: "2026-04-19 11:45",
    status: "closed",
    officer: "Sophea K.",
    preferredBranch: "Battambang",
    preferredDate: "Apr 25, 2026",
    preferredTime: "09:00",
    note: "I'm looking at a $90,000 house purchase and want to understand the down-payment, term, and rate options for the Housing Loan.",
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
    note: "First-time applying for a loan — would like to know what documents I need to bring and how long the approval usually takes for a small Micro Loan.",
  },
];

export type Feedback = {
  id: string;
  customer: string;
  rating: number;
  text: string;
  date: string;
  /** Officer reply, if any — drives the "Replied / No reply" status shared by
   *  the Consult & Feedback inbox and the customer detail page. */
  response?: string;
};

export const FEEDBACK: Feedback[] = [
  { id: "FB-028", customer: "Sokha Chan",  rating: 5, text: "Outstanding service, will recommend to family.",  date: "2026-04-21", response: "Thank you for the kind words, Sokha — we're delighted you had a great experience!" },
  { id: "FB-027", customer: "Pisey Ros",   rating: 5, text: "Fast approval, friendly officer.",                date: "2026-04-20" },
  { id: "FB-026", customer: "Dara Meas",   rating: 4, text: "Process was clear but took a few extra days.",    date: "2026-04-19" },
  { id: "FB-025", customer: "Vichet Lim",  rating: 5, text: "Loved the new app — very easy to track payments.",date: "2026-04-19" },
  { id: "FB-024", customer: "Sokha Chan",  rating: 4, text: "Good experience overall.",                        date: "2026-04-18" },
  { id: "FB-023", customer: "Narith Kim",  rating: 2, text: "Rejection reason was not clear.",                 date: "2026-04-18", response: "Sorry the reason wasn't clear — we've sent a detailed explanation in the app." },
  { id: "FB-022", customer: "Bopha Sok",   rating: 5, text: "App is easy to use, payments smooth.",            date: "2026-04-17" },
  { id: "FB-021", customer: "Rithy Pen",   rating: 4, text: "Helpful staff, smooth disbursement.",             date: "2026-04-16" },
  { id: "FB-020", customer: "Chenda Oum",  rating: 3, text: "Average. Hoped for a faster response on chat.",   date: "2026-04-15" },
  { id: "FB-019", customer: "Pisey Ros",   rating: 5, text: "Excellent customer support.",                     date: "2026-04-12" },
  { id: "FB-018", customer: "Sokha Chan",  rating: 4, text: "Documents upload could be simpler.",              date: "2026-04-10" },
  { id: "FB-017", customer: "Vichet Lim",  rating: 5, text: "Quick KYC verification.",                         date: "2026-04-08" },
  { id: "FB-016", customer: "Dara Meas",   rating: 3, text: "Interest rate slightly higher than competitors.", date: "2026-04-05" },
  { id: "FB-015", customer: "Bopha Sok",   rating: 5, text: "Birthday discount was a nice touch!",             date: "2026-04-02" },
  { id: "FB-014", customer: "Narith Kim",  rating: 1, text: "Long wait time for review.",                      date: "2026-03-28", response: "Apologies for the wait — we've added reviewers to speed things up." },
  { id: "FB-013", customer: "Rithy Pen",   rating: 4, text: "Smooth onboarding, branch staff were polite.",    date: "2026-03-25" },
  { id: "FB-012", customer: "Pisey Ros",   rating: 5, text: "ABA Pay integration works great.",                date: "2026-03-22" },
  { id: "FB-011", customer: "Vichet Lim",  rating: 4, text: "Push notifications are helpful reminders.",       date: "2026-03-18" },
  { id: "FB-010", customer: "Chenda Oum",  rating: 2, text: "App crashed twice while uploading documents.",    date: "2026-03-14", response: "Thanks for reporting this — the upload crash is fixed in the latest update." },
  { id: "FB-009", customer: "Sokha Chan",  rating: 5, text: "Best loan experience so far.",                    date: "2026-03-10", response: "That means a lot — thank you, Sokha!" },
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
  { id: "blog", label: "Blog", tone: "blue"    },
  { id: "news", label: "News", tone: "violet"  },
  { id: "tips", label: "Tips", tone: "emerald" },
  { id: "edu",  label: "Edu",  tone: "amber"   },
  { id: "csr",  label: "CSR",  tone: "rose"    },
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
    category: "news",
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
    title: "New Housing Loan launching soon",
    category: "news",
    excerpt: "Long-term financing for home purchase, up to $300,000. Launching May 1.",
    body:
      "We're launching the **Housing Loan (HL)** product on May 1, 2026.\n\nKey features:\n- Rate from **9% APR**\n- Term up to 240 months (20 years)\n- Hard or soft title collateral required\n- For house purchase in NHFC's operating areas\n\nVisit any branch from May 1 to apply.",
    thumbnail: "",
    author: "Admin",
    status: "Scheduled",
    date: "2026-04-25",
    views: 0,
  },
  {
    id: "P-010",
    title: "Branch hours update — Siem Reap",
    category: "news",
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
    category: "csr",
    excerpt: "Customers get 0.5% off on new loans during their birthday month.",
    body:
      "🎂 Celebrate your birthday with us — get **0.5% off** your APR on any new loan, valid for the entire month of your birthday.\n\n- Available on Micro Loan (ML), Small Business Loan (SBL), and SME loans\n- Stack with referral rewards\n- Apply in-app or at any branch",
    thumbnail: "",
    author: "Sophea K.",
    status: "Draft",
    date: "—",
    views: 0,
  },
  {
    id: "P-007",
    title: "Scholarships for rural students — 2026 program",
    category: "csr",
    excerpt:
      "WeLoan365 awards 50 scholarships to high-school students in rural provinces.",
    body:
      "As part of our community commitment, WeLoan365 will award **50 full scholarships** for the 2026 academic year to outstanding high-school students from rural provinces.\n\n## Who is eligible\n- Grade 11 or 12 students in NHFC operating areas\n- Demonstrated financial need\n- Minimum GPA 3.0\n\n## How to apply\n- Visit any branch with a letter from your school principal\n- Application deadline: June 30, 2026\n\nGiving back to the communities we serve is at the heart of who we are.",
    thumbnail: "",
    author: "Admin",
    status: "Published",
    date: "2026-04-05",
    views: 1820,
  },
  {
    id: "P-006",
    title: "Budgeting 101 — the 50/30/20 rule",
    category: "edu",
    excerpt:
      "A simple framework to split your income between needs, wants, and savings.",
    body:
      "The **50/30/20 rule** is a simple way to budget your monthly income:\n\n## 50% — Needs\nRent, utilities, groceries, transport, insurance.\n\n## 30% — Wants\nDining out, entertainment, hobbies, subscriptions.\n\n## 20% — Savings & debt repayment\nEmergency fund, retirement, paying down loans faster than required.\n\nThis isn't rigid — adjust the ratios to your situation. The point is to *spend with intention*, not by accident.",
    thumbnail: "",
    author: "Sophea K.",
    status: "Published",
    date: "2026-03-28",
    views: 1015,
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

export type StaffUserStatus = "Active" | "Inactive" | "Pending";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: StaffUserStatus;
  lastActive: string;
  /** 5-char referral code given to customers (CO referral program). When
   *  present, the user appears in Settings → Referral → Credit Officer codes. */
  code?: string;
  /** Lightweight referral metrics — populated for demo seed users so the
   *  CO codes table has realistic numbers. New users start at zero. */
  referralStats?: { referrals: number; applications: number; disbursed: number };
};

export const USERS: StaffUser[] = [
  { id: "U-01", name: "Laybun N.",    email: "laybunnavitou@nonghyup.com.kh", role: "Credit Officer",        branch: "Phnom Penh",  status: "Active",   lastActive: "2 min ago",  code: "10247", referralStats: { referrals: 28, applications: 19, disbursed: 11 } },
  { id: "U-02", name: "Sophea K.",    email: "sophea.k@nonghyup.com.kh",      role: "Senior Officer",        branch: "Siem Reap",   status: "Active",   lastActive: "1 hr ago",   code: "10248", referralStats: { referrals: 41, applications: 32, disbursed: 21 } },
  { id: "U-03", name: "Ratanak L.",   email: "ratanak.l@nonghyup.com.kh",     role: "Senior Officer",        branch: "Battambang",  status: "Active",   lastActive: "Today",      code: "10312", referralStats: { referrals: 14, applications:  9, disbursed:  5 } },
  { id: "U-04", name: "Sreyneang P.", email: "sreyneang.p@nonghyup.com.kh",   role: "Customer Service",      branch: "HQ",          status: "Active",   lastActive: "Today",      code: "10402", referralStats: { referrals:  9, applications:  4, disbursed:  2 } },
  { id: "U-05", name: "Kosal M.",     email: "kosal.m@nonghyup.com.kh",       role: "Admin",                 branch: "HQ",          status: "Inactive", lastActive: "30 d ago",   code: "10502", referralStats: { referrals:  0, applications:  0, disbursed:  0 } },
  { id: "U-06", name: "Pisey C.",     email: "pisey.c@nonghyup.com.kh",       role: "Customer Service",      branch: "Phnom Penh",  status: "Active",   lastActive: "10 min ago", code: "10401", referralStats: { referrals:  6, applications:  3, disbursed:  1 } },
  { id: "U-07", name: "Mengsrun H.",  email: "mengsrun.h@nonghyup.com.kh",    role: "Senior Officer",        branch: "HQ",          status: "Active",   lastActive: "Yesterday" },
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

/* Permission categories — ordered to mirror the left sidebar so admins
 * pick permissions in the same mental map they navigate the app:
 *
 *   OVERVIEW  → Overview
 *   WORK      → Customer (Accounts / Consultations / Feedback) →
 *               Loan Application → Loan Product → Blog Posts → Promotion
 *   OTHERS    → Setting
 *
 * Each section's permissions are granular enough that an admin can compose
 * any reasonable real-world role without editing code. */
export type PermissionCategory =
  | "Overview"
  | "Customer — All Accounts"
  | "Customer — Consultations"
  | "Customer — Feedback & Rate"
  | "Loan Application"
  | "Loan Product"
  | "Blog Posts"
  | "Promotion"
  | "Setting";

export const PERMISSIONS: Permission[] = [
  /* ---------- OVERVIEW ---------- */
  { key: "report.view",   label: "View Dashboard",                  category: "Overview" },
  { key: "report.export", label: "Export reports",                  category: "Overview" },

  /* ---------- CUSTOMER — All Accounts ---------- */
  { key: "customer.view",      label: "View customer accounts",   category: "Customer — All Accounts" },
  { key: "customer.pin_reset", label: "Reset customer PIN",       category: "Customer — All Accounts", sensitive: true },

  /* ---------- CUSTOMER — Consultations ---------- */
  { key: "consultation.view",   label: "View consultation requests", category: "Customer — Consultations" },
  { key: "consultation.assign", label: "Assign / reassign officer",  category: "Customer — Consultations" },
  { key: "consultation.reply",  label: "Reply to customer",          category: "Customer — Consultations" },
  { key: "consultation.close",  label: "Mark consultation closed",   category: "Customer — Consultations" },

  /* ---------- CUSTOMER — Feedback & Rate ---------- */
  { key: "feedback.view",  label: "View customer feedback", category: "Customer — Feedback & Rate" },
  { key: "feedback.reply", label: "Reply to feedback",      category: "Customer — Feedback & Rate" },

  /* ---------- LOAN APPLICATION ---------- */
  { key: "loan.view",        label: "View applications",          category: "Loan Application" },
  { key: "loan.review",      label: "Review application",         category: "Loan Application" },
  { key: "loan.approve",     label: "Accept application",         category: "Loan Application", sensitive: true },
  { key: "loan.reject",      label: "Reject application",         category: "Loan Application" },
  { key: "loan.reassign",    label: "Reassign Person in Charge",  category: "Loan Application" },
  { key: "loan.restructure", label: "Decide re-structure request", category: "Loan Application", sensitive: true },
  { key: "payment.view",     label: "View repayment history",     category: "Loan Application" },
  { key: "payment.record",   label: "Record repayment",           category: "Loan Application" },

  /* ---------- LOAN PRODUCT ---------- */
  { key: "product.view",     label: "View products",                 category: "Loan Product" },
  { key: "product.create",   label: "Create product",                category: "Loan Product" },
  { key: "product.edit",     label: "Edit product",                  category: "Loan Product" },
  { key: "product.reorder",  label: "Reorder products (drag-drop)",  category: "Loan Product" },
  { key: "product.activate", label: "Activate / deactivate product", category: "Loan Product", sensitive: true },

  /* ---------- BLOG POSTS ---------- */
  { key: "post.view",   label: "View posts", category: "Blog Posts" },
  { key: "post.manage", label: "Create / edit / publish / delete posts", category: "Blog Posts", sensitive: true },

  /* ---------- PROMOTION ---------- */
  { key: "promotion.view",   label: "View promotions",                   category: "Promotion" },
  { key: "promotion.manage", label: "Create / edit / delete promotions", category: "Promotion", sensitive: true },

  /* ---------- SETTING ---------- */
  { key: "setting.view",  label: "View settings",              category: "Setting" },
  { key: "setting.edit",  label: "Edit settings",              category: "Setting", sensitive: true },
  { key: "user.view",     label: "View staff users",           category: "Setting" },
  { key: "user.create",   label: "Create user",                category: "Setting", sensitive: true },
  { key: "user.edit",     label: "Edit user",                  category: "Setting" },
  { key: "role.edit",     label: "Manage roles & permissions", category: "Setting", sensitive: true },
  { key: "role.delete",   label: "Delete role",                category: "Setting", sensitive: true },
];

/**
 * Permission prerequisites — an action can't be granted without the "view" it
 * depends on (you can't reply to a consultation you can't see, approve a loan
 * you can't open, or manage users you can't list). The role editor uses this to
 * auto-enable prerequisites when an action is checked and to cascade removals
 * when a view is unchecked. Chains are allowed (payment.record → payment.view →
 * loan.view). */
export const PERMISSION_REQUIRES: Record<string, string> = {
  "report.export": "report.view",
  "customer.pin_reset": "customer.view",
  "consultation.assign": "consultation.view",
  "consultation.reply": "consultation.view",
  "consultation.close": "consultation.view",
  "feedback.reply": "feedback.view",
  "loan.review": "loan.view",
  "loan.approve": "loan.view",
  "loan.reject": "loan.view",
  "loan.reassign": "loan.view",
  "loan.restructure": "loan.view",
  "payment.view": "loan.view",
  "payment.record": "payment.view",
  "product.create": "product.view",
  "product.edit": "product.view",
  "product.reorder": "product.view",
  "product.activate": "product.view",
  "post.manage": "post.view",
  "promotion.manage": "promotion.view",
  "setting.edit": "setting.view",
  "user.create": "user.view",
  "user.edit": "user.view",
  "role.edit": "user.view",
  "role.delete": "user.view",
};

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
    key: "senior_officer",
    name: "Senior Officer",
    description: "Senior loan officer — reviews and approves loans up to the senior limit.",
    approvalLimit: 50000,
    permissions: [
      "report.view", "report.export",
      "customer.view",
      "consultation.view", "consultation.assign", "consultation.reply", "consultation.close",
      "feedback.view", "feedback.reply",
      "loan.view", "loan.review", "loan.approve", "loan.reject",
      "loan.reassign", "loan.restructure",
      "payment.view", "payment.record",
      "product.view",
      "post.view", "post.manage",
      "promotion.view", "promotion.manage",
      "user.view",
    ],
    userCount: 3,
    isSystem: true,
  },
  {
    key: "credit_officer",
    name: "Credit Officer",
    description: "Originate and review loan applications. Cannot approve.",
    approvalLimit: 0,
    permissions: [
      "report.view",
      "customer.view",
      "consultation.view", "consultation.reply",
      "feedback.view",
      "loan.view", "loan.review",
      "payment.view",
      "product.view",
      "post.view",
      "promotion.view",
      "setting.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "customer_service",
    name: "Customer Service",
    description: "Assist customers with their accounts, consultations, and repayments.",
    approvalLimit: 0,
    permissions: [
      "customer.view", "customer.pin_reset",
      "consultation.view", "consultation.reply", "consultation.close",
      "feedback.view", "feedback.reply",
      "payment.view", "payment.record",
      "post.view", "post.manage",
      "promotion.view", "promotion.manage",
      "setting.view",
    ],
    userCount: 2,
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
  { level: 1, name: "Credit Officer Review",   role: "Credit Officer", min: 0,     max: null,   description: "Initial review, KYC verification, and credit assessment. Always required." },
  { level: 2, name: "Senior Officer Approval", role: "Senior Officer", min: 2000,  max: 50000,  description: "Required for loans above $2,000, up to the senior limit." },
  { level: 3, name: "Admin Approval",          role: "Admin",          min: 50000, max: null,   description: "Required for loans above $50,000." },
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

/* ====================================================================
   PROMOTIONS (content management — Title, Description, Image)
   ==================================================================== */

export type PromotionStatus = "Active" | "Inactive";

export type Promotion = {
  id: string;
  title: string;
  description: string;
  /** data URL (uploaded) or remote URL; empty = placeholder */
  image: string;
  status: PromotionStatus;
  date: string;
  /** Optional end date (ISO YYYY-MM-DD) — when set, promo auto-expires on this day. */
  deadline?: string;
  /** Staff user who created / last edited this promotion. Mirrors the
   *  `author` field on blog posts so the table can show accountability. */
  author: string;
};

export const PROMOTIONS: Promotion[] = [
  {
    id: "PM-001",
    title: "Khmer New Year — 0% Processing Fee",
    description: "Apply for any Micro Loan during Khmer New Year and pay zero processing fee.",
    image: "",
    status: "Active",
    date: "2026-04-10",
    deadline: "2026-04-30",
    author: "Sophea K.",
  },
  {
    id: "PM-002",
    title: "Refer a Friend, Earn $10",
    description: "Get a $10 reward for every friend who is approved for their first loan.",
    image: "",
    status: "Active",
    date: "2026-03-22",
    author: "Laybun N.",
  },
  {
    id: "PM-003",
    title: "Birthday Month — 0.5% Off APR",
    description: "Enjoy 0.5% off your APR on any new loan during your birthday month.",
    image: "",
    status: "Active",
    date: "2026-02-14",
    deadline: "2026-12-31",
    author: "Sophea K.",
  },
  {
    id: "PM-004",
    title: "Housing Loan Launch Offer",
    description: "Introductory rate from 9% APR on the new Housing Loan product. Limited time.",
    image: "",
    status: "Inactive",
    date: "2026-01-05",
    author: "Admin",
  },
];
