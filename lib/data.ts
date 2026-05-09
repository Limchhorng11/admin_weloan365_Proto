export type ApplicationStatus =
  | "Pending"
  | "Review"
  | "Approved"
  | "Disbursed"
  | "Rejected";

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
};

export const APPLICATIONS: Application[] = [
  { id: "APP-10293", cid: "C-0421", name: "Sokha Chan",  product: "Personal",  amount: 2500,  term: 12, rate: 14.5, score: 712, branch: "Phnom Penh — Central",  range: "$2,500",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Pending"   },
  { id: "APP-10294", cid: "C-0422", name: "Dara Meas",   product: "SME Micro", amount: 8000,  term: 18, rate: 16.0, score: 684, branch: "Siem Reap",             range: "$8,000",  sent: "Apr 21, 2026", officer: "Laybun N.",  status: "Pending"   },
  { id: "APP-10295", cid: "C-0424", name: "Pisey Ros",   product: "Auto",      amount: 15000, term: 36, rate: 11.5, score: 758, branch: "Battambang",            range: "$15,000", sent: "Apr 20, 2026", officer: "Sophea K.",  status: "Disbursed" },
  { id: "APP-10296", cid: "C-0423", name: "Vichet Lim",  product: "Personal",  amount: 1200,  term: 6,  rate: 13.0, score: 745, branch: "Phnom Penh — Toul Kork",range: "$1,200",  sent: "Apr 19, 2026", officer: "Sophea K.",  status: "Review"    },
  { id: "APP-10297", cid: "C-0426", name: "Bopha Sok",   product: "Personal",  amount: 3000,  term: 12, rate: 14.5, score: 698, branch: "Kampong Cham",          range: "$3,000",  sent: "Apr 18, 2026", officer: "Unassigned", status: "Pending"   },
  { id: "APP-10298", cid: "C-0427", name: "Rithy Pen",   product: "SME Micro", amount: 12000, term: 24, rate: 15.5, score: 720, branch: "Siem Reap",             range: "$12,000", sent: "Apr 17, 2026", officer: "Sophea K.",  status: "Approved"  },
  { id: "APP-10299", cid: "C-0425", name: "Narith Kim",  product: "Agri",      amount: 4000,  term: 12, rate: 15.0, score: 640, branch: "Phnom Penh — Central",  range: "$4,000",  sent: "Apr 16, 2026", officer: "Laybun N.",  status: "Rejected"  },
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

export const PRODUCTS = [
  { id: "LP-01", name: "Personal Loan",   min: 500,  max: 5000,  rateMin: 13.0, rateMax: 15.5, termMin: 6,  termMax: 24, status: "active", loans: 412 },
  { id: "LP-02", name: "SME Micro Loan",  min: 2000, max: 25000, rateMin: 15.0, rateMax: 17.0, termMin: 6,  termMax: 36, status: "active", loans: 198 },
  { id: "LP-03", name: "Auto Loan",       min: 5000, max: 40000, rateMin: 10.5, rateMax: 12.5, termMin: 12, termMax: 60, status: "active", loans: 67  },
  { id: "LP-04", name: "Agri Loan",       min: 1000, max: 8000,  rateMin: 14.0, rateMax: 16.0, termMin: 6,  termMax: 18, status: "active", loans: 89  },
  { id: "LP-05", name: "Education Loan",  min: 1500, max: 12000, rateMin: 9.5,  rateMax: 11.0, termMin: 12, termMax: 48, status: "draft",  loans: 0   },
];

export const CONSULTATIONS = [
  { id: "RC-221", customer: "Sokha Chan",  topic: "Personal loan options",    requested: "2026-04-21 09:12", status: "open",    officer: "Unassigned" },
  { id: "RC-220", customer: "Dara Meas",   topic: "SME expansion financing",  requested: "2026-04-20 14:03", status: "open",    officer: "Laybun N." },
  { id: "RC-219", customer: "Pisey Ros",   topic: "Auto refinance rates",     requested: "2026-04-19 11:45", status: "closed",  officer: "Sophea K." },
  { id: "RC-218", customer: "Chenda Oum",  topic: "First-time borrower",      requested: "2026-04-18 16:20", status: "pending", officer: "Laybun N." },
];

export const FEEDBACK = [
  { id: "FB-012", customer: "Pisey Ros",   rating: 5, text: "Fast approval, friendly officer.",     date: "2026-04-20" },
  { id: "FB-011", customer: "Sokha Chan",  rating: 4, text: "Good experience overall.",             date: "2026-04-19" },
  { id: "FB-010", customer: "Narith Kim",  rating: 2, text: "Rejection reason was not clear.",      date: "2026-04-18" },
  { id: "FB-009", customer: "Bopha Sok",   rating: 5, text: "App is easy to use, payments smooth.", date: "2026-04-17" },
];

export const CHATS = [
  { id: "CH-88", customer: "Sokha Chan", last: "When will the loan be disbursed?",     unread: 2, at: "09:42" },
  { id: "CH-87", customer: "Pisey Ros",  last: "Thanks, received the confirmation!",   unread: 0, at: "08:11" },
  { id: "CH-86", customer: "Bopha Sok",  last: "I need to update my phone number.",    unread: 1, at: "Yday" },
  { id: "CH-85", customer: "Dara Meas",  last: "Can we reschedule next installment?",  unread: 0, at: "Mon" },
];

export const ANNOUNCEMENTS = [
  { id: "AN-08", title: "Khmer New Year holiday schedule",   audience: "All customers",  status: "Published", date: "2026-04-10" },
  { id: "AN-07", title: "New Education Loan launching soon", audience: "Segment: Youth", status: "Scheduled", date: "2026-04-25" },
  { id: "AN-06", title: "Branch hours update — Siem Reap",   audience: "Siem Reap",      status: "Published", date: "2026-04-02" },
  { id: "AN-05", title: "Maintenance window — app v2.1",     audience: "All customers",  status: "Draft",     date: "—" },
];

export const BLOGS = [
  { id: "BL-14", title: "5 tips before taking your first loan",  author: "Sophea K.", status: "Published", date: "2026-04-15", views: 1240 },
  { id: "BL-13", title: "Understanding APR vs flat rate",        author: "Laybun N.", status: "Published", date: "2026-04-08", views: 890  },
  { id: "BL-12", title: "How to improve your credit score",      author: "Sophea K.", status: "Draft",     date: "—",          views: 0    },
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
  branchScope: "own" | "all";
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
    branchScope: "all",
    permissions: "*",
    userCount: 1,
    isSystem: true,
  },
  {
    key: "branch_manager",
    name: "Branch Manager",
    description: "Manage branch operations and approve mid-tier loans.",
    approvalLimit: 50000,
    branchScope: "own",
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review", "loan.approve", "loan.reject",
      "disburse.execute",
      "payment.view", "payment.record",
      "portfolio.view", "portfolio.restructure",
      "report.view", "report.export",
      "user.view",
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
    branchScope: "own",
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review", "loan.approve", "loan.reject",
      "payment.view",
      "portfolio.view",
      "report.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "co",
    name: "Credit Officer",
    description: "Originate and review loan applications. Cannot approve.",
    approvalLimit: 0,
    branchScope: "own",
    permissions: [
      "customer.view", "customer.create", "customer.edit", "customer.kyc",
      "loan.view", "loan.create", "loan.review",
      "payment.view",
      "portfolio.view",
      "report.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "approval",
    name: "Approval Committee",
    description: "Final-tier approval for high-value loans. View-only on operations.",
    approvalLimit: null,
    branchScope: "all",
    permissions: [
      "customer.view",
      "loan.view", "loan.approve", "loan.reject",
      "portfolio.view",
      "report.view",
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
    branchScope: "own",
    permissions: [
      "customer.view",
      "disburse.execute",
      "payment.record", "payment.view",
      "portfolio.view",
    ],
    userCount: 1,
    isSystem: true,
  },
  {
    key: "compliance",
    name: "Compliance",
    description: "Read-only access to all data for audit and regulatory reporting.",
    approvalLimit: 0,
    branchScope: "all",
    permissions: [
      "customer.view",
      "loan.view",
      "payment.view",
      "portfolio.view",
      "report.view", "report.export",
      "user.view",
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

export const BRANCHES = [
  { id: "BR-01", name: "Phnom Penh — Central",   address: "#123, St. 271, Sangkat BKK1", phone: "+855 23 900 001", open: "Mon–Fri 8:00–17:00" },
  { id: "BR-02", name: "Phnom Penh — Toul Kork", address: "#56, St. 289, Toul Kork",      phone: "+855 23 900 002", open: "Mon–Fri 8:00–17:00" },
  { id: "BR-03", name: "Siem Reap",              address: "#12, Wat Bo Road",             phone: "+855 63 900 003", open: "Mon–Sat 8:00–17:00" },
  { id: "BR-04", name: "Battambang",             address: "#78, St. 3, Svay Por",         phone: "+855 53 900 004", open: "Mon–Fri 8:00–17:00" },
  { id: "BR-05", name: "Kampong Cham",           address: "#10, Preah Monivong Blvd",     phone: "+855 42 900 005", open: "Mon–Fri 8:00–17:00" },
];
