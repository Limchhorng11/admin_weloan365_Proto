"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ShieldCheck,
  Users,
  Building2,
  CircleDollarSign,
  Lock,
  Check,
  Minus,
  Search,
  Crown,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckSquare,
  Square,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { useRole } from "@/lib/role-context";
import {
  USERS,
  ROLES,
  PERMISSIONS,
  type Role,
  type Permission,
  type PermissionCategory,
} from "@/lib/data";

type Tab = "users" | "roles";

type TabDef = {
  key: Tab;
  label: string;
  count?: number;
  needsAny?: string[];
};

const TABS: TabDef[] = [
  { key: "users", label: "Users", count: USERS.length, needsAny: ["user.view"] },
  { key: "roles", label: "Roles", count: ROLES.length, needsAny: ["user.view"] },
];

export function UsersRolesView() {
  const { can, role } = useRole();

  const visibleTabs = useMemo(
    () => TABS.filter(t => !t.needsAny || t.needsAny.some(p => can(p))),
    [can]
  );

  const [tab, setTab] = useState<Tab>(visibleTabs[0]?.key ?? "users");

  // If the active tab becomes hidden (role switched), fall back to first visible.
  useEffect(() => {
    if (!visibleTabs.some(t => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "users");
    }
  }, [visibleTabs, tab]);

  if (visibleTabs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">No access</h2>
        <p className="text-sm text-gray-500 mt-1">
          The <span className="font-medium">{role.name}</span> role cannot view users & roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">User & Role Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage staff users and the roles that control what each user can do.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px flex items-center gap-2",
              tab === t.key
                ? "border-brand-600 text-brand-700 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-medium rounded-full px-1.5 py-0.5",
                  tab === t.key ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
    </div>
  );
}

/* ---------- shared bits ---------- */

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5", className)}>{children}</div>
  );
}

function fmt$(n: number | null | undefined) {
  if (n === null || n === undefined) return "Unlimited";
  if (n === 0) return "—";
  return "$" + n.toLocaleString();
}

/* ---------- USERS ---------- */

type StaffUser = (typeof USERS)[number];

function UsersTab() {
  const { can } = useRole();
  const [users, setUsers] = useState<StaffUser[]>(USERS);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = users.filter(
    u =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      u.role.toLowerCase().includes(filter.toLowerCase())
  );

  const nextId = useMemo(() => {
    const maxN = users.reduce((m, u) => {
      const n = parseInt((u.id ?? "").replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `U-${String(maxN + 1).padStart(2, "0")}`;
  }, [users]);

  const toggleStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u))
    );
  };

  const handleSave = (input: Omit<StaffUser, "id" | "lastActive"> & { id?: string }) => {
    if (input.id) {
      setUsers(prev => prev.map(u => (u.id === input.id ? { ...u, ...input } as StaffUser : u)));
    } else {
      // Spread first, then set id/lastActive last so input's `id: undefined`
      // (passed in create mode) can't overwrite the generated id.
      const created: StaffUser = {
        ...input,
        id: nextId,
        lastActive: "Just now",
      };
      setUsers(prev => [created, ...prev]);
    }
    setEditing(null);
    setCreating(false);
  };

  return (
    <Card className="!p-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <div>
          <div className="font-medium text-gray-900">Staff users</div>
          <div className="text-[11px] text-gray-500">
            {users.length} total · {users.filter(u => u.status === "Active").length} active
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-44"
            />
          </div>
          {can("user.create") && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add user
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["User", "Role", "Branch", "Status", ""].map((h, i) => (
                <th
                  key={i}
                  className="text-left px-5 py-2 text-[12px] font-medium text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const role = ROLES.find(r => r.name === u.role);
              const isActive = u.status === "Active";
              return (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                        {u.name.split(" ").map(s => s[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="inline-flex items-center gap-1.5 text-gray-700">
                      {role?.key === "admin" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{u.role}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.branch}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {can("user.edit") && (
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className={cn(
                            "text-xs hover:underline font-medium",
                            isActive ? "text-rose-600" : "text-emerald-600"
                          )}
                          title={isActive ? "Deactivate user" : "Activate user"}
                        >
                          {isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setEditing(u)}
                          className="text-xs text-brand-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <UserModal
          user={editing}
          nextId={nextId}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={handleSave}
        />
      )}
    </Card>
  );
}

/** Least-privileged non-admin role — the safe default when creating a new user. */
const DEFAULT_NEW_USER_ROLE =
  [...ROLES]
    .filter(r => r.key !== "admin")
    .sort(
      (a, b) =>
        (a.permissions === "*" ? Infinity : a.permissions.length) -
        (b.permissions === "*" ? Infinity : b.permissions.length)
    )[0]?.name ?? ROLES[0].name;

function UserModal({
  user,
  nextId,
  onCancel,
  onSave,
}: {
  user: StaffUser | null;
  nextId: string;
  onCancel: () => void;
  onSave: (input: Omit<StaffUser, "id" | "lastActive"> & { id?: string }) => void;
}) {
  const editMode = user !== null;
  // An Admin user's role is locked — it can't be changed from the edit form.
  const editingAdmin =
    editMode && ROLES.find(r => r.name === user!.role)?.key === "admin";
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? DEFAULT_NEW_USER_ROLE);
  const [branch, setBranch] = useState(user?.branch ?? "Phnom Penh");
  const [status, setStatus] = useState<StaffUser["status"]>(user?.status ?? "Active");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Enter a valid email address");

    onSave({
      id: user?.id,
      name: name.trim(),
      email: email.trim(),
      role,
      branch: branch.trim(),
      status,
    });
  };

  const branches = Array.from(new Set(["Phnom Penh", "Siem Reap", "Battambang", "HQ", "Kampong Cham", ...USERS.map(u => u.branch)]));

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {editMode ? "Edit user" : "Add user"}
            </div>
            <div className="text-[11px] text-gray-500">
              {editMode ? `Updating ${user!.id}` : `New user ID will be ${nextId}`}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Full name *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sokha Chan"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@kosign.com.kh"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={editingAdmin}
                className={cn(
                  "mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                  editingAdmin ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                )}
              >
                {ROLES.map(r => (
                  <option key={r.key} value={r.name}>{r.name}</option>
                ))}
              </select>
              <div className="text-[11px] text-gray-500 mt-1">
                {editingAdmin
                  ? "The Admin role can't be changed here."
                  : "Manage roles in the Roles tab."}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Branch</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <div className="mt-1 flex gap-2">
                {(["Active", "Inactive"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-md border transition",
                      status === s
                        ? s === "Active"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30"
                          : "border-gray-400 bg-gray-50 text-gray-700 ring-1 ring-gray-400/30"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
            >
              {editMode ? "Save changes" : "Add user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- ROLES ---------- */

type StageKey = "intake" | "review" | "approve" | "disburse" | "audit" | "general";

const LOAN_STAGES: { key: StageKey; label: string; short: string; desc: string; chip: string; dot: string }[] = [
  { key: "intake",   label: "Application Intake", short: "Intake",   desc: "Captures and packages loan applications.",  chip: "bg-sky-50 text-sky-700",         dot: "bg-sky-500" },
  { key: "review",   label: "Credit Review",      short: "Review",   desc: "Reviews documents and credit assessment.",  chip: "bg-violet-50 text-violet-700",   dot: "bg-violet-500" },
  { key: "approve",  label: "Approval",           short: "Approve",  desc: "Approves or rejects loan applications.",    chip: "bg-amber-50 text-amber-800",     dot: "bg-amber-500" },
  { key: "disburse", label: "Disbursement",       short: "Disburse", desc: "Releases funds and records repayments.",    chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  { key: "audit",    label: "Compliance & Audit", short: "Audit",    desc: "Post-disbursement review and audit.",       chip: "bg-rose-50 text-rose-700",       dot: "bg-rose-500" },
];

const STAGE_BY_KEY: Record<StageKey, (typeof LOAN_STAGES)[number] | undefined> =
  Object.fromEntries(LOAN_STAGES.map(s => [s.key, s])) as Record<StageKey, (typeof LOAN_STAGES)[number]>;

type ManagedRole = Role & { stage: StageKey };

type RoleTemplate = {
  name: string;
  description: string;
  stage: StageKey;
  approvalLimit: number | null;
  permissions: string[];
};

/** Every permission key — keeps the "Full access" template in sync as permissions evolve. */
const ALL_PERMISSION_KEYS = PERMISSIONS.map(p => p.key);

const TEMPLATES: RoleTemplate[] = [
  {
    name: "Super Admin",
    description: "Full access — manage users, roles, and all settings.",
    stage: "general",
    approvalLimit: null,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    name: "Credit Officer",
    description: "Loan review — onboards customers and reviews loan applications.",
    stage: "review",
    approvalLimit: 0,
    permissions: ["customer.view", "customer.create", "customer.edit", "customer.kyc", "loan.view", "loan.create", "loan.review", "report.view"],
  },
  {
    name: "Finance Officer",
    description: "Repayment — records and tracks customer loan repayments.",
    stage: "general",
    approvalLimit: 0,
    permissions: ["customer.view", "loan.view", "payment.record", "payment.view"],
  },
  {
    name: "Support",
    description: "Customer support — assists customers with their accounts and applications.",
    stage: "general",
    approvalLimit: 0,
    permissions: ["customer.view", "customer.create", "customer.edit", "loan.view", "payment.view", "report.view"],
  },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function RolesTab() {
  const { can } = useRole();
  const canManage = can("role.edit");
  const initialRoles: ManagedRole[] = ROLES.filter(r => r.isSystem).map(r => ({ ...r, stage: "general" }));
  const [roles, setRoles] = useState<ManagedRole[]>(initialRoles);
  const [selected, setSelected] = useState<ManagedRole | null>(initialRoles[0] ?? null);
  const [creating, setCreating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ManagedRole | null>(null);
  const totalPerms = PERMISSIONS.length;
  const grantedCount = (r: ManagedRole) =>
    r.permissions === "*" ? totalPerms : r.permissions.length;

  const customCount = roles.filter(r => !r.isSystem).length;

  const removeRole = (key: string) => {
    setRoles(prev => {
      const next = prev.filter(r => r.key !== key);
      if (selected?.key === key) setSelected(next[0] ?? null);
      return next;
    });
    setConfirmDelete(null);
  };

  const resetAll = () => {
    setRoles(initialRoles);
    setSelected(initialRoles[0] ?? null);
    setConfirmReset(false);
  };

  const addRole = (r: ManagedRole) => {
    setRoles(prev => [...prev, r]);
    setSelected(r);
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {roles.length} {roles.length === 1 ? "role" : "roles"}
            {customCount > 0 && <span className="text-gray-400"> · {customCount} custom</span>}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Click a role to expand and see its permissions.
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {customCount > 0 && (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-xs text-gray-600 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium"
                title="Remove all custom roles"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <button
              onClick={() => setCreating(true)}
              className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Create role
            </button>
          </div>
        )}
      </div>

      {/* Role cards */}
      {roles.length === 0 ? (
        <Card className="!p-0">
          <EmptyRoles canCreate={canManage} onCreate={() => setCreating(true)} />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {roles.map(r => (
            <RoleCard
              key={r.key}
              role={r}
              expanded={selected?.key === r.key}
              onToggle={() => setSelected(selected?.key === r.key ? null : r)}
              canManage={canManage}
              onDelete={() => setConfirmDelete(r)}
              totalPerms={totalPerms}
              granted={grantedCount(r)}
            />
          ))}
        </div>
      )}

      {creating && (
        <CreateRoleModal
          existingKeys={roles.map(r => r.key)}
          onCancel={() => setCreating(false)}
          onSave={addRole}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.name}?`}
          message={`This will remove the ${confirmDelete.name} role. Users currently assigned to it will need a new role. This cannot be undone.`}
          confirmLabel="Delete role"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeRole(confirmDelete.key)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset all roles?"
          message={`This will remove ${customCount} custom ${customCount === 1 ? "role" : "roles"} and keep only system roles (Admin). This cannot be undone.`}
          confirmLabel="Reset all"
          onCancel={() => setConfirmReset(false)}
          onConfirm={resetAll}
        />
      )}
    </div>
  );
}

function RoleCard({
  role,
  expanded,
  onToggle,
  canManage,
  onDelete,
  totalPerms,
  granted,
}: {
  role: ManagedRole;
  expanded: boolean;
  onToggle: () => void;
  canManage: boolean;
  onDelete: () => void;
  totalPerms: number;
  granted: number;
}) {
  const stage = STAGE_BY_KEY[role.stage];
  return (
    <div
      className={cn(
        "bg-white rounded-xl border transition",
        expanded ? "border-brand-300 ring-1 ring-brand-500/20" : "border-gray-200"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="px-5 py-3.5 flex items-start gap-3 cursor-pointer rounded-xl hover:bg-gray-50/50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {role.key === "admin" && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            <div className="text-sm font-semibold text-gray-900">{role.name}</div>
            {role.isSystem ? (
              <span className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                System
              </span>
            ) : stage && stage.key !== "general" ? (
              <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5", stage.chip)}>
                {stage.label}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{role.description}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-600">
            <span className="inline-flex items-center gap-1">
              <CircleDollarSign className="w-3 h-3 text-gray-400" />
              {fmt$(role.approvalLimit)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400" />
              {role.userCount} {role.userCount === 1 ? "user" : "users"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3 text-gray-400" />
              {granted}/{totalPerms} permissions
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {canManage && !role.isSystem && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
              aria-label={`Delete ${role.name}`}
              title="Delete role"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expanded && "rotate-180 text-brand-600"
              )}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40 rounded-b-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Permissions
            </div>
            <div className="text-[11px] text-gray-500">
              {granted} of {totalPerms} granted
            </div>
          </div>
          <PermissionList role={role} />
        </div>
      )}
    </div>
  );
}

function EmptyRoles({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
        <Users className="w-6 h-6" />
      </div>
      <div className="text-sm font-medium text-gray-900">No roles yet</div>
      <div className="text-xs text-gray-500 mt-1 max-w-[220px] mx-auto">
        Create one role per step of your loan process — intake, review, approval, disbursement, audit.
      </div>
      {canCreate && (
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Create your first role
        </button>
      )}
    </div>
  );
}

/* ---------- Create role modal ---------- */

function CreateRoleModal({
  existingKeys,
  onCancel,
  onSave,
}: {
  existingKeys: string[];
  onCancel: () => void;
  onSave: (role: ManagedRole) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<StageKey>("intake");
  const [approvalLimitStr, setApprovalLimitStr] = useState("0");
  const [unlimited, setUnlimited] = useState(false);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupBy(PERMISSIONS, p => p.category), []);

  const applyTemplate = (t: RoleTemplate) => {
    setName(t.name);
    setDescription(t.description);
    setStage(t.stage);
    if (t.approvalLimit === null) {
      setUnlimited(true);
      setApprovalLimitStr("0");
    } else {
      setUnlimited(false);
      setApprovalLimitStr(String(t.approvalLimit));
    }
    setPerms(new Set(t.permissions));
    setError(null);
  };

  const togglePerm = (key: string) => {
    setPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (cat: string, list: Permission[]) => {
    const allGranted = list.every(p => perms.has(p.key));
    setPerms(prev => {
      const next = new Set(prev);
      list.forEach(p => {
        if (allGranted) next.delete(p.key);
        else next.add(p.key);
      });
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Role name is required");
    let key = slugify(trimmed);
    if (!key) return setError("Role name must contain letters or numbers");
    if (existingKeys.includes(key)) {
      let n = 2;
      while (existingKeys.includes(`${key}-${n}`)) n += 1;
      key = `${key}-${n}`;
    }
    const limit = unlimited ? null : Math.max(0, parseInt(approvalLimitStr || "0", 10));
    const role: ManagedRole = {
      key,
      name: trimmed,
      description: description.trim() || "—",
      stage,
      approvalLimit: limit,
      permissions: Array.from(perms),
      userCount: 0,
      isSystem: false,
    };
    onSave(role);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-sm font-semibold text-gray-900">Create new role</div>
            <div className="text-[11px] text-gray-500">Define a sub-user level with the permissions you want to grant.</div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          {/* Templates */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Start from a template
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(t => (
                <button
                  type="button"
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:border-brand-500 hover:bg-brand-50 text-gray-700 hover:text-brand-700"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Role name *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Senior Credit Reviewer"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this role does in the loan workflow"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Permissions</label>
              <div className="text-[11px] text-gray-500">{perms.size} selected</div>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {(Object.entries(grouped) as [PermissionCategory, Permission[]][]).map(([cat, list]) => {
                const allGranted = list.every(p => perms.has(p.key));
                const someGranted = list.some(p => perms.has(p.key));
                return (
                  <div key={cat} className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat, list)}
                      className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900"
                    >
                      {allGranted ? (
                        <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                      ) : someGranted ? (
                        <Minus className="w-3.5 h-3.5 text-brand-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      {cat}
                    </button>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {list.map(p => {
                        const granted = perms.has(p.key);
                        return (
                          <label
                            key={p.key}
                            className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={() => togglePerm(p.key)}
                              className="rounded text-brand-600 focus:ring-brand-500/30"
                            />
                            <span className={cn("flex-1", granted ? "text-gray-900" : "text-gray-600")}>
                              {p.label}
                            </span>
                            {p.sensitive && (
                              <span className="text-[10px] font-medium bg-amber-50 text-amber-700 rounded px-1.5 py-0.5">
                                Sensitive
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </form>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={submit}
            className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
          >
            Create role
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <div className="text-xs text-gray-600 mt-1">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-base font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function PermissionList({ role }: { role: Role }) {
  const has = (key: string) =>
    role.permissions === "*" || role.permissions.includes(key);
  const grouped = groupBy(PERMISSIONS, p => p.category);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
            {cat}
          </div>
          <div className="space-y-1">
            {list.map(p => {
              const granted = has(p.key);
              return (
                <div
                  key={p.key}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {granted ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={cn(granted ? "text-gray-900" : "text-gray-400")}>
                      {p.label}
                    </span>
                    {p.sensitive && granted && (
                      <span className="text-[10px] font-medium bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Sensitive
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">{p.key}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupBy<T, K extends string>(arr: T[], keyFn: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
