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
  /** MWL applications only — overseas destination country the worker is
   *  departing to (e.g. "South Korea", "Japan"). */
  destination?: string;
  /** Set when an approved loan's borrower has requested re-structure. */
  restructureRequest?: RestructureRequest;
  /** Set when an officer rejects the application — shown in the Remark column. */
  rejectReason?: string;
};

export const APPLICATIONS: Application[] = [
  /* ── Type × status matrix — the 3 product types (Staff / MWL / NON-MWL)
        each with a Progress and an Approved application, kept at the top of
        the table so every type-specific detail layout is one click away. ── */

  // Staff — Progress / Approved
  { id: "APP-10301", cid: "C-0429", name: "Sreymom Chea", product: "Staff Loan", amount: 6000, term: 24, rate: 8.5, score: 802, branch: "HQ", range: "$6,000", sent: "Apr 14, 2026", officer: "Visal P.", status: "Progress" },
  { id: "APP-10304", cid: "C-0432", name: "Kimheng Sao", product: "Staff Loan", amount: 10000, term: 36, rate: 9.0, score: 815, branch: "HQ", range: "$10,000", sent: "Apr 12, 2026", officer: "Sophea K.", status: "Approved" },

  // MWL — Progress / Approved
  { id: "APP-10303", cid: "C-0431", name: "Kunthea Sok", product: "Migrant Worker Loan", amount: 4000, term: 18, rate: 13.0, score: 668, branch: "Phnom Penh — Central", range: "$4,000", sent: "Apr 17, 2026", officer: "Ratanak L.", status: "Progress", destination: "Japan" },
  { id: "APP-10302", cid: "C-0430", name: "Piseth Vong", product: "Migrant Worker Loan", amount: 5500, term: 24, rate: 12.5, score: 705, branch: "Phnom Penh — Central", range: "$5,500", sent: "Apr 13, 2026", officer: "Sophea K.", status: "Approved", destination: "South Korea" },

  // NON-MWL — Progress / Approved
  { id: "APP-10293", cid: "C-0421", name: "Sokha Chan",  product: "Micro Loan (ML)",  amount: 2500,  term: 12, rate: 14.5, score: 712, branch: "Phnom Penh — Central",  range: "$2,500",  sent: "Apr 21, 2026", officer: "Visal P.",  status: "Progress" },
  {
    id: "APP-10231", cid: "C-0421", name: "Sokha Chan",  product: "Micro Loan (ML)",  amount: 1500,  term: 6,  rate: 13.5, score: 712, branch: "Phnom Penh — Central",  range: "$1,500",  sent: "Nov 4, 2025",  officer: "Sophea K.",  status: "Approved",
    restructureRequest: {
      requestedAt: "2026-05-18",
      reason: "Repayment deadline overlaps with my term-end school fees. I'd like a slightly longer term so monthly amounts are easier.",
      requestedChange: "Extend term from 6 → 9 months; lower monthly installment to ~$175.",
      phone: "+855 12 345 678",
    },
  },
  { id: "APP-10294", cid: "C-0422", name: "Dara Meas",   product: "Small Business Loan (SBL)", amount: 8000,  term: 18, rate: 16.0, score: 684, branch: "Siem Reap",             range: "$8,000",  sent: "Apr 21, 2026", officer: "Visal P.",  status: "Progress" },
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
  { id: "APP-10299", cid: "C-0425", name: "Narith Kim",  product: "Micro Loan (ML)",  amount: 4000,  term: 12, rate: 15.0, score: 640, branch: "Phnom Penh — Central",  range: "$4,000",  sent: "Apr 16, 2026", officer: "Visal P.",  status: "Rejected" },
  { id: "APP-10300", cid: "C-0433", name: "Chantha Neang", product: "Housing Loan (HL)", amount: 45000, term: 120, rate: 9.5, score: 775, branch: "Phnom Penh — Toul Kork", range: "$45,000", sent: "Apr 15, 2026", officer: "Ratanak L.", status: "Approved" },
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
  /** Set when the customer signed up using a Credit Officer's referral code
   *  (see `User.code` in the Referral program). Omitted for direct signups. */
  referral?: {
    /** The 5-char CO referral code entered at signup. */
    code: string;
    /** Referring officer's name, denormalized for display. */
    officer: string;
    /** ISO date the referral code was used. */
    date: string;
    /** The referral reward is only credited once the referred customer's
     *  first loan is disbursed — before that it sits as "pending". */
    rewardStatus: "pending" | "credited";
  };
};

export const CUSTOMERS: Customer[] = [
  // Row 1 — freshly onboarded, KYC verified, but hasn't applied for a loan
  // yet: the "0 loans" case for a normal active account (as opposed to
  // Chenda Oum below, whose 0 loans comes from a suspended account).
  {
    id: "C-0434", name: "Sopheak Ly",   phone: "+855 15 620 048", email: "sopheak.ly@mail.com", kyc: "verified", loans: 0, joined: "2026-07-10", branch: "Phnom Penh — Central",
    nationalId: "200147 ••• 4482", dob: "2000-09-12", address: "#152, St. 271, Phnom Penh", occupation: "Graphic designer", monthlyIncome: 650, bankAccount: "ABA •••• 7734", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Chamkarmon", commune: "Sangkat Tuol Tumpung", village: "Phum 3", houseStreet: "No. 152 · St. 271" },
      employment: { type: "Employed", companyName: "Pixel Studio", businessType: "Creative Services", businessNature: "Design Agency", incomeSource: "Salary", incomeRange: "$500 – $1,000 / month" },
    },
    devices: [
      { platform: "android", model: "Samsung Galaxy A54", os: "Android 14",   lastSeen: "Today"       },
    ],
    referral: { code: "10247", officer: "Visal P.", date: "2026-07-10", rewardStatus: "pending" },
  },
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
    referral: { code: "10248", officer: "Sophea K.", date: "2023-06-11", rewardStatus: "credited" },
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
    referral: { code: "10312", officer: "Ratanak L.", date: "2025-02-28", rewardStatus: "pending" },
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
  // ── Applicants backing the type × status matrix in APPLICATIONS ──
  {
    id: "C-0429", name: "Sreymom Chea", phone: "+855 78 234 561", email: "sreymom.c@nonghyup.com.kh", kyc: "verified", loans: 0, joined: "2024-08-01", branch: "HQ",
    nationalId: "200334 ••• 8812", dob: "1994-02-17", address: "#77, St. 360, BKK3, Phnom Penh", occupation: "Credit Analyst (NHFC)", monthlyIncome: 1400, bankAccount: "ABA •••• 5521", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Chamkarmon", commune: "Sangkat BKK 3", village: "Phum 4", houseStreet: "No. 77 · St. 360" },
      employment: { type: "Employed", companyName: "NongHyup Finance (Cambodia)", businessType: "Financial Services", businessNature: "Microfinance", incomeSource: "Salary", incomeRange: "$1,000 – $1,500 / month" },
    },
    devices: [
      { platform: "android", model: "Samsung Galaxy S23",   os: "Android 14",  lastSeen: "5 min ago"  },
    ],
  },
  {
    id: "C-0430", name: "Piseth Vong",  phone: "+855 93 447 210", email: "piseth@mail.com", kyc: "verified", loans: 1, joined: "2025-11-20", branch: "Phnom Penh — Central",
    nationalId: "199745 ••• 3307", dob: "1997-06-30", address: "#12, St. 217, Meanchey, Phnom Penh", occupation: "Factory worker (departing to Korea)", monthlyIncome: 450, bankAccount: "Wing •••• 8830", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Meanchey", commune: "Sangkat Stung Meanchey", village: "Phum 3", houseStreet: "No. 12 · St. 217" },
      employment: { type: "Employed", companyName: "Evergreen Garment", businessType: "Manufacturing", businessNature: "Garment Factory", incomeSource: "Salary", incomeRange: "Under $500 / month" },
    },
    devices: [
      { platform: "android", model: "Oppo A78",             os: "ColorOS 13",  lastSeen: "3 hr ago"   },
    ],
  },
  {
    id: "C-0431", name: "Kunthea Sok",  phone: "+855 69 552 348", email: "kunthea@mail.com", kyc: "pending", loans: 0, joined: "2026-03-05", branch: "Phnom Penh — Central",
    nationalId: "200521 ••• 9954", dob: "1999-01-08", address: "#31, St. 371, Stung Meanchey, Phnom Penh", occupation: "Seamstress (departing to Japan)", monthlyIncome: 400, bankAccount: "—", maritalStatus: "Single",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Meanchey", commune: "Sangkat Boeung Tumpun", village: "Phum 6", houseStreet: "No. 31 · St. 371" },
      employment: { type: "Employed", companyName: "Golden Needle Apparel", businessType: "Manufacturing", businessNature: "Garment Factory", incomeSource: "Salary", incomeRange: "Under $500 / month" },
    },
    devices: [
      { platform: "android", model: "Vivo Y22",             os: "Android 13",  lastSeen: "1 day ago"  },
    ],
  },
  {
    id: "C-0432", name: "Kimheng Sao",  phone: "+855 12 890 774", email: "kimheng.s@nonghyup.com.kh", kyc: "verified", loans: 1, joined: "2022-05-16", branch: "HQ",
    nationalId: "198912 ••• 2245", dob: "1989-12-03", address: "#204, St. 63, BKK1, Phnom Penh", occupation: "Branch Operations Manager (NHFC)", monthlyIncome: 2200, bankAccount: "ABA •••• 0093", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Chamkarmon", commune: "Sangkat BKK 1", village: "Phum 2", houseStreet: "No. 204 · St. 63" },
      employment: { type: "Employed", companyName: "NongHyup Finance (Cambodia)", businessType: "Financial Services", businessNature: "Microfinance", incomeSource: "Salary", incomeRange: "$2,000 – $2,500 / month" },
    },
    devices: [
      { platform: "ios",     model: "iPhone 13",            os: "iOS 17.4",    lastSeen: "Today"      },
    ],
  },
  {
    id: "C-0433", name: "Chantha Neang", phone: "+855 81 660 254", email: "chantha@mail.com", kyc: "verified", loans: 1, joined: "2023-10-09", branch: "Phnom Penh — Toul Kork",
    nationalId: "199234 ••• 5568", dob: "1992-04-21", address: "#88, St. 315, Toul Kork, Phnom Penh", occupation: "Civil engineer", monthlyIncome: 1800, bankAccount: "ACLEDA •••• 4417", maritalStatus: "Married",
    profile: {
      address: { cityProvince: "Phnom Penh", district: "Khan Toul Kork", commune: "Sangkat Boeung Kak 2", village: "Phum 7", houseStreet: "No. 88 · St. 315" },
      employment: { type: "Employed", companyName: "Mekong Build Co.", businessType: "Construction", businessNature: "Civil Engineering", incomeSource: "Salary", incomeRange: "$1,500 – $2,000 / month" },
    },
    devices: [
      { platform: "android", model: "Xiaomi 13",            os: "MIUI 14",     lastSeen: "2 days ago" },
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
  /** Khmer + English — same bilingual pattern as Post titles. */
  name: LocalizedText;
  min: number;
  max: number;
  rateMin: number;
  rateMax: number;
  termMin: number;
  termMax: number;
  status: LoanProductStatus;
  loans: number;
  /** Public-facing description (CMS body). Markdown-ish plain text, per locale. */
  description: LocalizedText;
  /** Customer eligibility criteria (one per line). */
  eligibility: string;
  /** Key feature highlights (one "• line" per row, same format as eligibility). */
  keyFeatures?: string;
  /** Documents the customer needs to provide (one per line).
   *  Repurposed as "Benefits" in newer forms — kept under this key for
   *  backwards compatibility with seeded data. */
  requiredDocs: string;
  processingFee: number;   // % of disbursed amount
  latePenalty: number;     // % per month on overdue
  earlyPayoff: boolean;    // is early payoff allowed
  /** Repayment method (e.g. "Flexible", "Periodic principal and interest"). */
  repaymentMethod?: string;
  /** Loan purpose shown at a glance (e.g. "Overseas job expenses"). */
  purpose?: string;
  /** Dynamic "Loan At A Glance" rows — admin-defined label/value pairs
   *  (e.g. "Interest Rate" → "From 0.98% / month"). */
  atAGlance?: { label: string; value: string }[];
  /** Product kind — defaults to "non-mwl" in legacy records. */
  kind?: ProductKind;
  /** For mwl-sub: destination country. May be a legacy MWL_COUNTRIES code
   *  (KR / JP / SG → flag lookup works) or a free-form name added by admins. */
  country?: string;
  /** For mwl-sub: the parent's product id. */
  parentId?: string;
  /** Thumbnail (3:4 portrait) — shown in the product list / carousel in the
   *  customer app. Image only (data URL in the prototype). */
  thumbnail?: string;
  /** Detail image or video (1:1 square) — shown on the product's own detail
   *  page in the customer app (data URL in the prototype). */
  detailImage?: string;
  detailImageType?: "image" | "video";
  /** Reference product icon shown beside the product name (data URL in the prototype). */
  icon?: string;
  /** Structured required documents with an optional caption + uploaded icon
   *  (data URL). `requiredDocs` above is kept as the newline-joined names for
   *  backward compatibility. */
  requiredDocuments?: { name: string; note?: string; icon?: string }[];
  /** Product FAQ — question/answer pairs shown on the customer product page. */
  faqs?: { question: string; answer: string }[];
};

export const PRODUCTS: LoanProduct[] = [
  /* ───────── NHFC product catalogue (per reference sheet) ───────── */
  {
    id: "LP-07",
    name: { en: "Micro Loan (ML)", km: "" },
    min: 100, max: 3000,
    rateMin: 14.0, rateMax: 18.0,
    termMin: 6, termMax: 48,
    status: "active", loans: 0,
    description: {
      en:
        "Micro Loan (ML) is designed to support low-income people in rural and urban " +
        "areas through micro / small businesses and agricultural activities, offered " +
        "in both Khmer Riel and US Dollars.",
      km: "",
    },
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
    name: { en: "Small Business Loan (SBL)", km: "" },
    min: 1000, max: 30000,
    rateMin: 12.0, rateMax: 16.0,
    termMin: 6, termMax: 96,
    status: "active", loans: 0,
    description: {
      en:
        "Small Business Loan (SBL) supports clients in starting or expanding micro / " +
        "small businesses for improved profitability and sustainable growth. Provided " +
        "to clients in both rural and urban areas, offered in US Dollars and Khmer Riel.",
      km: "",
    },
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
    name: { en: "Small & Medium Enterprise (SME)", km: "" },
    min: 5000, max: 100000,
    rateMin: 11.0, rateMax: 15.0,
    termMin: 6, termMax: 120,
    status: "active", loans: 0,
    description: {
      en:
        "SME Loan supports existing and new clients or entrepreneurs in establishing " +
        "new businesses or expanding existing ones, offered in both US Dollars and " +
        "Khmer Riel.",
      km: "",
    },
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
    name: { en: "Housing Loan (HL)", km: "" },
    min: 10000, max: 300000,
    rateMin: 9.0, rateMax: 13.0,
    termMin: 12, termMax: 240,
    status: "active", loans: 0,
    description: {
      en:
        "Housing Loan (HL) supports affordable housing in response to population growth " +
        "and real-estate market demand. A long-term loan provided for house purchase, " +
        "offered in both US Dollars and Khmer Riel.",
      km: "",
    },
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
  {
    id: "LP-11",
    name: { en: "Staff Loan", km: "" },
    min: 500, max: 20000,
    rateMin: 8.0, rateMax: 10.0,
    termMin: 6, termMax: 60,
    status: "active", loans: 0,
    description: {
      en:
        "Staff Loan is an exclusive benefit for NHFC employees, supporting personal " +
        "needs such as housing, education, and emergencies at preferential rates, " +
        "offered in both US Dollars and Khmer Riel.",
      km: "",
    },
    eligibility:
      "• Full-time NHFC employee\n" +
      "• Minimum 12 months of employment\n" +
      "• Good performance record\n" +
      "• No active default on existing loans",
    requiredDocs:
      "National ID\nEmployee card\nSalary statement (last 6 months)\nEmployment contract",
    processingFee: 0.5,
    latePenalty: 1.0,
    earlyPayoff: true,
  },

  /* ───────── MWL family — parent + country sub-products ───────── */
  {
    id: "LP-06",
    name: { en: "Migrant Worker Loan", km: "" },
    min: 500, max: 8000,
    rateMin: 12.0, rateMax: 14.0,
    termMin: 6, termMax: 36,
    status: "active", loans: 0,
    description: {
      en:
        "Pre-departure financing for Cambodian workers heading overseas — " +
        "covers placement fees, visa, flight, training and settle-in costs. " +
        "Country-specific terms live as sub-products under this family.",
      km: "",
    },
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
    name: { en: "MWL — Korea", km: "" },
    min: 1000, max: 8000,
    rateMin: 12.0, rateMax: 13.5,
    termMin: 12, termMax: 36,
    status: "active", loans: 38,
    description: {
      en:
        "MWL variant for workers placed under the Korean Employment Permit " +
        "System (EPS). Repayment aligned with the post-arrival KRW salary " +
        "cycle. Disbursement timed with departure.",
      km: "",
    },
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
    name: { en: "MWL — Japan", km: "" },
    min: 800, max: 7000,
    rateMin: 12.5, rateMax: 14.0,
    termMin: 12, termMax: 36,
    status: "active", loans: 21,
    description: {
      en:
        "MWL variant for workers on Technical Intern Training (TITP) or " +
        "Specified Skilled Worker (SSW) visas. Covers JLPT certification, " +
        "placement fees, and pre-departure training.",
      km: "",
    },
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
    name: { en: "MWL — Singapore", km: "" },
    min: 500, max: 5000,
    rateMin: 13.0, rateMax: 14.0,
    termMin: 6, termMax: 24,
    status: "draft", loans: 0,
    description: {
      en:
        "MWL variant for workers on a Singapore Work Permit (WP). Smaller " +
        "ticket sizes reflect the shorter typical contract length and lower " +
        "placement-fee structure.",
      km: "",
    },
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
    topic: "Loan Application Guidance",
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
    topic: "General Inquiry",
    requested: "2026-04-20 14:03",
    status: "waiting",
    officer: "Visal P.",
    preferredBranch: "Siem Reap",
    preferredDate: "May 27, 2026",
    preferredTime: "10:30",
    note: "Looking to expand my grocery shop into a second location near Wat Bo. Want to understand SME limits and what collateral is typically required.",
  },
  {
    id: "RC-219",
    customer: "Pisey Ros",
    topic: "Loan Application Guidance",
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
    topic: "Account & Document Support",
    requested: "2026-04-18 16:20",
    status: "closed",
    officer: "Visal P.",
    preferredBranch: "Phnom Penh — Central",
    preferredDate: "Apr 28, 2026",
    preferredTime: "14:30",
    note: "First-time applying for a loan — would like to know what documents I need to bring and how long the approval usually takes for a small Micro Loan.",
  },
];

/** Categories customers pick when submitting feedback in the mobile app. */
export const FEEDBACK_SUBJECTS = [
  "Suggestion",
  "Loan processing delay",
  "Incorrect charges or fees",
  "Staff conduct",
  "Payment not recorded",
  "App or digital service issue",
  "Data privacy concern",
  "Other",
] as const;

export type Feedback = {
  id: string;
  customer: string;
  rating: number;
  subject: (typeof FEEDBACK_SUBJECTS)[number];
  text: string;
  date: string;
  /** Officer reply, if any — drives the "Replied / No reply" status shared by
   *  the Consult & Feedback inbox and the customer detail page. */
  response?: string;
};

export const FEEDBACK: Feedback[] = [
  { id: "FB-028", customer: "Sokha Chan",  rating: 5, subject: "Staff conduct",                  text: "Outstanding service, will recommend to family.",  date: "2026-04-21", response: "Thank you for the kind words, Sokha — we're delighted you had a great experience!" },
  { id: "FB-027", customer: "Pisey Ros",   rating: 5, subject: "Staff conduct",                  text: "Fast approval, friendly officer.",                date: "2026-04-20" },
  { id: "FB-026", customer: "Dara Meas",   rating: 4, subject: "Loan processing delay",          text: "Process was clear but took a few extra days.",    date: "2026-04-19" },
  { id: "FB-025", customer: "Vichet Lim",  rating: 5, subject: "App or digital service issue",   text: "Loved the new app — very easy to track payments.",date: "2026-04-19" },
  { id: "FB-024", customer: "Sokha Chan",  rating: 4, subject: "Other",                          text: "Good experience overall.",                        date: "2026-04-18" },
  { id: "FB-023", customer: "Narith Kim",  rating: 2, subject: "Loan processing delay",          text: "Rejection reason was not clear.",                 date: "2026-04-18", response: "Sorry the reason wasn't clear — we've sent a detailed explanation in the app." },
  { id: "FB-022", customer: "Bopha Sok",   rating: 5, subject: "App or digital service issue",   text: "App is easy to use, payments smooth.",            date: "2026-04-17" },
  { id: "FB-021", customer: "Rithy Pen",   rating: 4, subject: "Staff conduct",                  text: "Helpful staff, smooth disbursement.",             date: "2026-04-16" },
  { id: "FB-020", customer: "Chenda Oum",  rating: 3, subject: "Suggestion",                     text: "Average. Hoped for a faster response on chat.",   date: "2026-04-15" },
  { id: "FB-019", customer: "Pisey Ros",   rating: 5, subject: "Staff conduct",                  text: "Excellent customer support.",                     date: "2026-04-12" },
  { id: "FB-018", customer: "Sokha Chan",  rating: 4, subject: "Suggestion",                     text: "Documents upload could be simpler.",              date: "2026-04-10" },
  { id: "FB-017", customer: "Vichet Lim",  rating: 5, subject: "Data privacy concern",           text: "Quick KYC verification.",                         date: "2026-04-08" },
  { id: "FB-016", customer: "Dara Meas",   rating: 3, subject: "Incorrect charges or fees",      text: "Interest rate slightly higher than competitors.", date: "2026-04-05" },
  { id: "FB-015", customer: "Bopha Sok",   rating: 5, subject: "Other",                          text: "Birthday discount was a nice touch!",             date: "2026-04-02" },
  { id: "FB-014", customer: "Narith Kim",  rating: 1, subject: "Loan processing delay",          text: "Long wait time for review.",                      date: "2026-03-28", response: "Apologies for the wait — we've added reviewers to speed things up." },
  { id: "FB-013", customer: "Rithy Pen",   rating: 4, subject: "Staff conduct",                  text: "Smooth onboarding, branch staff were polite.",    date: "2026-03-25" },
  { id: "FB-012", customer: "Pisey Ros",   rating: 5, subject: "App or digital service issue",   text: "ABA Pay integration works great.",                date: "2026-03-22" },
  { id: "FB-011", customer: "Vichet Lim",  rating: 4, subject: "App or digital service issue",   text: "Push notifications are helpful reminders.",       date: "2026-03-18" },
  { id: "FB-010", customer: "Chenda Oum",  rating: 2, subject: "App or digital service issue",   text: "App crashed twice while uploading documents.",    date: "2026-03-14", response: "Thanks for reporting this — the upload crash is fixed in the latest update." },
  { id: "FB-009", customer: "Sokha Chan",  rating: 5, subject: "Other",                          text: "Best loan experience so far.",                    date: "2026-03-10", response: "That means a lot — thank you, Sokha!" },
  { id: "FB-008", customer: "Dara Meas",   rating: 4, subject: "Suggestion",                     text: "Branch locator would be more useful with map.",   date: "2026-03-05" },
  { id: "FB-007", customer: "Bopha Sok",   rating: 3, subject: "Payment not recorded",           text: "Statement download could include CSV format.",    date: "2026-02-28" },
  { id: "FB-006", customer: "Rithy Pen",   rating: 5, subject: "Loan processing delay",          text: "Renewal was painless.",                           date: "2026-02-22" },
  { id: "FB-005", customer: "Pisey Ros",   rating: 4, subject: "Suggestion",                     text: "Khmer translation could be more natural.",        date: "2026-02-15" },
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

export type PostCategoryId = string;

/** Which page manages the category: "media" = Blog Posts, "csr" = CSR Activity,
 *  "announcement" = Announcement. */
export type PostCategoryGroup = "media" | "csr" | "announcement";

/** `tone` is one of the fixed swatch names in CATEGORY_TONE /
 *  CATEGORY_OVERLAY_TONE (see components/posts-manager.tsx). */
export type PostCategory = {
  id: PostCategoryId;
  label: string;
  tone: string;
  group: PostCategoryGroup;
};

/** Seed list only — admins can add/remove categories at runtime from the
 *  post editor (see PostsManager), so this isn't the full set of ids that
 *  may end up on a Post.category. */
export const POST_CATEGORIES: PostCategory[] = [
  { id: "blog", label: "Blog", tone: "blue",    group: "media" },
  { id: "news", label: "News", tone: "violet",  group: "media" },
  { id: "tips", label: "Tips", tone: "emerald", group: "media" },
  { id: "edu",  label: "Edu",  tone: "amber",   group: "media" },
  // CSR Activity sub-categories, shown as the badge on CSR posts in the
  // customer app (e.g. "COMMUNITY WELFARE" over the header photo).
  { id: "community-welfare", label: "Community Welfare", tone: "rose", group: "csr" },
  { id: "public-service",    label: "Public Service",    tone: "blue", group: "csr" },
  // Announcement sub-categories.
  { id: "general",     label: "General",     tone: "emerald", group: "announcement" },
  { id: "maintenance", label: "Maintenance",  tone: "amber",   group: "announcement" },
];
export type PostStatus = "Published" | "Scheduled" | "Failed";

/** Posts publish in 2 languages for the customer mobile app. Khmer is the
 *  canonical/required language; English is an optional translation filled
 *  in as it becomes available. */
export type Locale = "km" | "en";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "km", label: "Khmer",   flag: "🇰🇭" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export type LocalizedText = Record<Locale, string>;

export const emptyLocalizedText = (): LocalizedText => ({ km: "", en: "" });

/** One item of a post's header media (image or video URL / data: URL, or a
 *  linked YouTube video — shown in the mobile app's cover media section
 *  alongside uploaded images/videos). */
export type PostMedia = { url: string; type: "image" | "video" | "youtube" };

export type Post = {
  id: string;
  title: LocalizedText;
  category: PostCategoryId;
  /** Body uses lightweight markdown (## headings, **bold**, *italic*, - lists). */
  body: LocalizedText;
  /** Short summary shown in feed cards. */
  excerpt: LocalizedText;
  /** Header media — the customer app shows several as a swipeable carousel
   *  (e.g. a "1/4" photo counter). First item doubles as the table thumbnail. */
  media: PostMedia[];
  /** Optional place name shown under the title (e.g. CSR activity location). */
  location?: string;
  /** CSR posts only — a short pull-quote highlighted in the article. */
  quotation?: string;
  /** Optional secondary block shown below the article body (e.g. "A continued
   *  commitment" follow-up note on a CSR activity post). */
  secondaryTitle?: LocalizedText;
  secondaryBody?: LocalizedText;
  author: string;
  status: PostStatus;
  /** Display date for the list (or "—" when not yet published / no schedule). */
  date: string;
  views: number;
};

/** Seed posts were authored in English only — wrap as a localized record with
 *  Khmer left blank until translated. */
const en = (text: string): LocalizedText => ({ en: text, km: "" });

export const POSTS: Post[] = [
  {
    id: "P-014",
    title: en("5 tips before taking your first loan"),
    category: "tips",
    excerpt: en("Plan ahead, know your numbers, and pick the right product."),
    body: en(
      "## Plan ahead\nUnderstanding your monthly budget before applying makes the entire process smoother.\n\n## Know your numbers\nCheck your **debt-to-income ratio** — lenders look for under 40%.\n\n- Calculate your total monthly debt\n- Divide by your gross monthly income\n- Multiply by 100 to get the percentage\n\n## Pick the right product\nMatch the loan to the purpose — short term for emergencies, longer term for assets."
    ),
    media: [],
    author: "Sophea K.",
    status: "Published",
    date: "2026-04-15",
    views: 1240,
  },
  {
    id: "P-013",
    title: en("Khmer New Year holiday schedule"),
    category: "news",
    excerpt: en("All branches will be closed Apr 13–15. Mobile app remains available."),
    body: en(
      "All WeLoan365 branches will be **closed for Khmer New Year** from Apr 13 to Apr 15, 2026.\n\n- The mobile app remains fully available\n- Loan payments processed automatically continue\n- In-app chat will be staffed at reduced capacity\n\nWe wish all our customers a happy and prosperous new year!"
    ),
    media: [],
    author: "Admin",
    status: "Published",
    date: "2026-04-10",
    views: 3120,
  },
  {
    id: "P-012",
    title: en("Understanding APR vs flat rate"),
    category: "blog",
    excerpt: en("What's the difference, and which is better for you?"),
    body: en(
      "APR (Annual Percentage Rate) is the **true cost** of a loan, expressed as a yearly rate.\n\nFlat rate looks simpler but can be deceiving — the actual cost is usually higher than the headline number.\n\n## Quick comparison\n- *Flat 10% × 1 year* ≈ APR of ~18%\n- Always compare loans using APR\n\nAsk your loan officer to walk through both numbers before you sign."
    ),
    media: [],
    author: "Visal P.",
    status: "Published",
    date: "2026-04-08",
    views: 890,
  },
  {
    id: "P-011",
    title: en("New Housing Loan launching soon"),
    category: "news",
    excerpt: en("Long-term financing for home purchase, up to $300,000. Launching May 1."),
    body: en(
      "We're launching the **Housing Loan (HL)** product on May 1, 2026.\n\nKey features:\n- Rate from **9% APR**\n- Term up to 240 months (20 years)\n- Hard or soft title collateral required\n- For house purchase in NHFC's operating areas\n\nVisit any branch from May 1 to apply."
    ),
    media: [],
    author: "Admin",
    status: "Scheduled",
    date: "2026-04-25",
    views: 0,
  },
  {
    id: "P-010",
    title: en("Branch hours update — Siem Reap"),
    category: "news",
    excerpt: en("Extended Saturday hours starting April."),
    body: en(
      "The Siem Reap branch will now be open on **Saturdays** from 8:00 AM to 1:00 PM, in addition to weekday hours.\n\nNo appointment required — walk-ins welcome."
    ),
    media: [],
    author: "Ratanak L.",
    status: "Published",
    date: "2026-04-02",
    views: 542,
  },
  {
    id: "P-009",
    title: en("Birthday rate discount — limited time"),
    category: "public-service",
    excerpt: en("Customers get 0.5% off on new loans during their birthday month."),
    body: en(
      "🎂 Celebrate your birthday with us — get **0.5% off** your APR on any new loan, valid for the entire month of your birthday.\n\n- Available on Micro Loan (ML), Small Business Loan (SBL), and SME loans\n- Stack with referral rewards\n- Apply in-app or at any branch"
    ),
    media: [],
    author: "Sophea K.",
    status: "Scheduled",
    date: "2026-04-01",
    views: 0,
  },
  {
    id: "P-015",
    title: en("Free financial literacy workshop — Battambang"),
    category: "public-service",
    excerpt: en("A half-day workshop on budgeting and responsible borrowing, open to the public."),
    body: en(
      "WeLoan365 hosted a free financial literacy workshop in Battambang, covering budgeting basics, responsible borrowing, and how to read a loan agreement.\n\n- Open to the public, no registration fee\n- Handouts provided in Khmer\n- Q&A session with branch staff"
    ),
    media: [],
    location: "Battambang",
    author: "Ratanak L.",
    status: "Failed",
    date: "2026-04-12",
    views: 0,
  },
  {
    id: "P-007",
    title: en("Scholarships for rural students — 2026 program"),
    category: "community-welfare",
    excerpt: en(
      "WeLoan365 awards 50 scholarships to high-school students in rural provinces."
    ),
    body: en(
      "As part of our community commitment, WeLoan365 will award **50 full scholarships** for the 2026 academic year to outstanding high-school students from rural provinces.\n\n## Who is eligible\n- Grade 11 or 12 students in NHFC operating areas\n- Demonstrated financial need\n- Minimum GPA 3.0\n\n## How to apply\n- Visit any branch with a letter from your school principal\n- Application deadline: June 30, 2026\n\nGiving back to the communities we serve is at the heart of who we are."
    ),
    media: [],
    author: "Admin",
    status: "Published",
    date: "2026-04-05",
    views: 1820,
  },
  {
    id: "P-006",
    title: en("Budgeting 101 — the 50/30/20 rule"),
    category: "edu",
    excerpt: en(
      "A simple framework to split your income between needs, wants, and savings."
    ),
    body: en(
      "The **50/30/20 rule** is a simple way to budget your monthly income:\n\n## 50% — Needs\nRent, utilities, groceries, transport, insurance.\n\n## 30% — Wants\nDining out, entertainment, hobbies, subscriptions.\n\n## 20% — Savings & debt repayment\nEmergency fund, retirement, paying down loans faster than required.\n\nThis isn't rigid — adjust the ratios to your situation. The point is to *spend with intention*, not by accident."
    ),
    media: [],
    author: "Sophea K.",
    status: "Published",
    date: "2026-03-28",
    views: 1015,
  },
  {
    id: "P-008",
    title: en("How to improve your credit score"),
    category: "tips",
    excerpt: en("Small habits that move your score in the right direction."),
    body: en(
      "Improving your credit score takes time, but a few habits compound quickly:\n\n## Pay on time\nThis is the single biggest factor.\n\n## Keep utilisation low\nUse less than 30% of available credit on any line.\n\n## Avoid opening too many accounts at once\nEach hard inquiry costs you a few points."
    ),
    media: [],
    author: "Sophea K.",
    status: "Failed",
    date: "2026-03-25",
    views: 0,
  },
  {
    id: "P-016",
    title: en("Public holiday — office closed Apr 13–15"),
    category: "general",
    excerpt: en("All branches closed for Khmer New Year. Mobile app support remains available."),
    body: en(
      "All NHFC branches will be closed for the Khmer New Year public holiday from **April 13 to 15, 2026**. Normal branch hours resume April 16.\n\nCustomer support through the mobile app chat remains available throughout the holiday for urgent matters."
    ),
    media: [],
    author: "Admin",
    status: "Published",
    date: "2026-04-10",
    views: 640,
  },
  {
    id: "P-017",
    title: en("Scheduled maintenance — mobile app, Apr 20"),
    category: "maintenance",
    excerpt: en("Brief downtime expected between 1:00–2:00 AM while we roll out an update."),
    body: en(
      "The customer mobile app will be briefly unavailable between **1:00 AM and 2:00 AM on April 20, 2026** while we deploy a scheduled update. Loan applications and payments are not affected outside this window.\n\nWe recommend completing any pending actions before 1:00 AM."
    ),
    media: [],
    author: "Admin",
    status: "Scheduled",
    date: "2026-04-20",
    views: 0,
  },
  {
    id: "P-018",
    title: en("Updated privacy policy — effective May 1"),
    category: "general",
    excerpt: en("Push notification failed to send; announcement was not delivered to customers."),
    body: en(
      "Our privacy policy has been updated to clarify how loan application data is shared with credit bureaus. The updated policy takes effect **May 1, 2026** and is available in the mobile app under Settings > Legal.\n\nThis announcement failed to publish due to a push notification delivery error and needs to be re-sent."
    ),
    media: [],
    author: "Admin",
    status: "Failed",
    date: "2026-04-22",
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
  /** Company staff ID. Its **last 5 digits** double as the officer's referral
   *  code (see `referralCodeFromStaffId`) — the code customers enter at signup
   *  is always derived from this, never stored separately, so the two can't
   *  drift apart. Optional: staff whose ID hasn't been issued yet don't take
   *  part in the referral program. */
  staffId?: string;
  /** Lightweight referral metrics — populated for demo seed users so the
   *  CO codes table has realistic numbers. New users start at zero. */
  referralStats?: { referrals: number; applications: number; disbursed: number };
};

/** The referral code an officer gives to customers: the last 5 digits of their
 *  staff ID. Returns null when the ID carries fewer than 5 digits (or is unset),
 *  meaning that staff member has no referral code yet. */
export function referralCodeFromStaffId(staffId: string | undefined): string | null {
  const digits = (staffId ?? "").replace(/\D/g, "");
  return digits.length >= 5 ? digits.slice(-5) : null;
}

export const USERS: StaffUser[] = [
  { id: "U-01", name: "Visal P.",    email: "visal.p@nonghyup.com.kh", role: "Credit Officer",        branch: "Phnom Penh",  status: "Active",   lastActive: "2 min ago",  staffId: "NH-20110247", referralStats: { referrals: 28, applications: 19, disbursed: 11 } },
  { id: "U-02", name: "Sophea K.",    email: "sophea.k@nonghyup.com.kh",      role: "Senior Officer",        branch: "Siem Reap",   status: "Active",   lastActive: "1 hr ago",   staffId: "NH-20110248", referralStats: { referrals: 41, applications: 32, disbursed: 21 } },
  { id: "U-03", name: "Ratanak L.",   email: "ratanak.l@nonghyup.com.kh",     role: "Senior Officer",        branch: "Battambang",  status: "Active",   lastActive: "Today",      staffId: "NH-20110312", referralStats: { referrals: 14, applications:  9, disbursed:  5 } },
  { id: "U-04", name: "Sreyneang P.", email: "sreyneang.p@nonghyup.com.kh",   role: "Customer Service",      branch: "HQ",          status: "Active",   lastActive: "Today",      staffId: "NH-20110402", referralStats: { referrals:  9, applications:  4, disbursed:  2 } },
  { id: "U-05", name: "Kosal M.",     email: "kosal.m@nonghyup.com.kh",       role: "Admin",                 branch: "HQ",          status: "Inactive", lastActive: "30 d ago",   staffId: "NH-20110502", referralStats: { referrals:  0, applications:  0, disbursed:  0 } },
  { id: "U-06", name: "Pisey C.",     email: "pisey.c@nonghyup.com.kh",       role: "Customer Service",      branch: "Phnom Penh",  status: "Active",   lastActive: "10 min ago", staffId: "NH-20110401", referralStats: { referrals:  6, applications:  3, disbursed:  1 } },
  // No staff ID issued yet — so no referral code. Keeps the "not in the
  // referral program" case visible in the demo data.
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
  | "Customer — Complaint & Rate"
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
  { key: "consultation.close",  label: "Mark as completed",          category: "Customer — Consultations" },

  /* ---------- CUSTOMER — Feedback & Rate ---------- */
  { key: "feedback.view",  label: "View customer complaints", category: "Customer — Complaint & Rate" },
  { key: "feedback.reply", label: "Reply to complaint",       category: "Customer — Complaint & Rate" },

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
      "consultation.view", "consultation.assign", "consultation.close",
      "feedback.view",
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
      "consultation.view", "consultation.close",
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
    description: "Assist customers with their accounts and repayments.",
    approvalLimit: 0,
    permissions: [
      "customer.view", "customer.pin_reset",
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

export type PromotionStatus = "Published" | "Scheduled" | "Failed";

/** The single action button shown on a promotion in the customer app —
 *  either deep-links to a loan product's detail page, or dials a number. */
export type PromotionCta =
  | { type: "loan"; productId: string }
  | { type: "call"; phone: string };

export type Promotion = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  /** Shown on the promotion card/list in the customer app. Image only.
   *  data URL (uploaded) or remote URL; empty = placeholder */
  thumbnail: string;
  /** Optional image shown on the promotion's own detail page. */
  detailImage?: string;
  status: PromotionStatus;
  date: string;
  /** Optional end date (ISO YYYY-MM-DD) — when set, promo auto-expires on this day. */
  deadline?: string;
  /** Staff user who created / last edited this promotion. Mirrors the
   *  `author` field on blog posts so the table can show accountability. */
  author: string;
  /** Choice button — what tapping this promotion does in the customer app. */
  cta: PromotionCta;
};

export const PROMOTIONS: Promotion[] = [
  {
    id: "PM-001",
    title: en("Khmer New Year — 0% Processing Fee"),
    description: en("Apply for any Micro Loan during Khmer New Year and pay zero processing fee."),
    thumbnail: "",
    status: "Published",
    date: "2026-04-10",
    deadline: "2026-04-30",
    author: "Sophea K.",
    cta: { type: "loan", productId: "LP-07" }, // Micro Loan (ML)
  },
  {
    id: "PM-002",
    title: en("Refer a Friend, Earn $10"),
    description: en("Get a $10 reward for every friend who is approved for their first loan."),
    thumbnail: "",
    status: "Failed",
    date: "2026-03-22",
    author: "Visal P.",
    cta: { type: "call", phone: "+855 23 999 000" },
  },
  {
    id: "PM-003",
    title: en("Birthday Month — 0.5% Off APR"),
    description: en("Enjoy 0.5% off your APR on any new loan during your birthday month."),
    thumbnail: "",
    status: "Published",
    date: "2026-02-14",
    deadline: "2026-12-31",
    author: "Sophea K.",
    cta: { type: "call", phone: "+855 23 999 000" },
  },
  {
    id: "PM-004",
    title: en("Housing Loan Launch Offer"),
    description: en("Introductory rate from 9% APR on the new Housing Loan product. Limited time."),
    thumbnail: "",
    status: "Scheduled",
    date: "2026-05-01",
    author: "Admin",
    cta: { type: "loan", productId: "LP-10" }, // Housing Loan (HL)
  },
];
