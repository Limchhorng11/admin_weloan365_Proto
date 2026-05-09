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
  Pencil,
  Copy,
  Search,
  Crown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { useRole } from "@/lib/role-context";
import {
  USERS,
  ROLES,
  PERMISSIONS,
  APPROVAL_LAYERS,
  type Role,
  type Permission,
  type PermissionCategory,
} from "@/lib/data";

type Tab = "users" | "roles" | "permissions" | "layers";

type TabDef = {
  key: Tab;
  label: string;
  count?: number;
  /** All listed permissions must pass; if any single OR-group is given as nested array, that group is OR-checked. */
  needsAny?: string[];
};

const TABS: TabDef[] = [
  { key: "users",       label: "Users",          count: USERS.length,         needsAny: ["user.view"] },
  { key: "roles",       label: "Roles",          count: ROLES.length,         needsAny: ["user.view"] },
  { key: "permissions", label: "Permissions",    count: PERMISSIONS.length,   needsAny: ["user.view"] },
  // Approval Layers: relevant to approvers and auditors. CO/Cashier won't see it.
  { key: "layers",      label: "Approval Layers", count: APPROVAL_LAYERS.length, needsAny: ["loan.approve", "audit.view"] },
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
        <h2 className="text-lg font-semibold text-gray-900">Users & Roles</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage staff access using role-based permissions and tiered approval layers.
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

      {tab === "users"       && <UsersTab />}
      {tab === "roles"       && <RolesTab />}
      {tab === "permissions" && <PermissionsTab />}
      {tab === "layers"      && <LayersTab />}
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

function UsersTab() {
  const { can } = useRole();
  const [filter, setFilter] = useState("");
  const filtered = USERS.filter(
    u =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      u.role.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <Card className="!p-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <div className="font-medium text-gray-900">Staff users</div>
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
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
              {["User", "Role", "Branch", "Last active", "Status", ""].map((h, i) => (
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
                  <td className="px-5 py-3 text-gray-500 text-xs">{u.lastActive}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {can("user.edit") && (
                      <button className="text-xs text-brand-600 hover:underline font-medium">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- ROLES ---------- */

function RolesTab() {
  const { can } = useRole();
  const canManage = can("role.edit");
  const [selected, setSelected] = useState<Role>(ROLES[0]);
  const totalPerms = PERMISSIONS.length;
  const grantedCount = (r: Role) =>
    r.permissions === "*" ? totalPerms : r.permissions.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Roles list */}
      <Card className="!p-0 col-span-1">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-medium text-gray-900">All roles</div>
          {canManage && (
            <button className="text-brand-600 hover:underline text-xs font-medium inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {ROLES.map(r => {
            const active = r.key === selected.key;
            return (
              <button
                key={r.key}
                onClick={() => setSelected(r)}
                className={cn(
                  "w-full text-left px-5 py-3 hover:bg-gray-50 flex items-start gap-2",
                  active && "bg-brand-50/60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {r.key === "admin" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    <div
                      className={cn(
                        "text-sm font-medium",
                        active ? "text-brand-700" : "text-gray-900"
                      )}
                    >
                      {r.name}
                    </div>
                    {r.isSystem && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                        System
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {r.userCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {grantedCount(r)} / {totalPerms}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-gray-400 mt-1 flex-shrink-0",
                    active && "text-brand-600"
                  )}
                />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Role detail */}
      <div className="col-span-2 space-y-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
                {selected.isSystem && (
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                    System role
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
            </div>
            <div className="flex gap-1">
              {canManage ? (
                <>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" title="Duplicate">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded px-2 py-1 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Read-only
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Stat
              icon={CircleDollarSign}
              label="Approval limit"
              value={fmt$(selected.approvalLimit)}
            />
            <Stat
              icon={Building2}
              label="Branch scope"
              value={selected.branchScope === "all" ? "All branches" : "Own branch only"}
            />
            <Stat icon={Users} label="Assigned users" value={`${selected.userCount}`} />
          </div>
        </Card>

        <Card className="!p-0">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="font-medium text-gray-900">Permissions</div>
            <div className="text-xs text-gray-500">
              {grantedCount(selected)} of {totalPerms} granted
            </div>
          </div>
          <div className="px-5 py-3 max-h-[280px] overflow-y-auto scrollbar-thin">
            <PermissionList role={selected} />
          </div>
        </Card>
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

/* ---------- PERMISSIONS MATRIX ---------- */

function PermissionsTab() {
  const grouped = groupBy(PERMISSIONS, p => p.category);
  const has = (role: Role, key: string) =>
    role.permissions === "*" || role.permissions.includes(key);

  return (
    <Card className="!p-0">
      <div className="px-5 py-3 border-b border-gray-200">
        <div className="font-medium text-gray-900">Permissions matrix</div>
        <div className="text-xs text-gray-500 mt-0.5">
          Quick comparison of what each role can do.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[260px]">
                Permission
              </th>
              {ROLES.map(r => (
                <th
                  key={r.key}
                  className="text-center px-3 py-2.5 text-[11px] font-medium text-gray-500 whitespace-nowrap"
                  title={r.description}
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.entries(grouped) as [PermissionCategory, Permission[]][]).map(
              ([cat, list]) => (
                <RowGroup key={cat} cat={cat} list={list} has={has} />
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RowGroup({
  cat,
  list,
  has,
}: {
  cat: PermissionCategory;
  list: Permission[];
  has: (role: Role, key: string) => boolean;
}) {
  return (
    <>
      <tr className="bg-gray-50/60">
        <td
          colSpan={ROLES.length + 1}
          className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500"
        >
          {cat}
        </td>
      </tr>
      {list.map(p => (
        <tr key={p.key} className="border-t border-gray-100">
          <td className="px-4 py-2 sticky left-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{p.label}</span>
              {p.sensitive && (
                <span className="text-[10px] font-medium bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Sensitive
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-gray-400">{p.key}</div>
          </td>
          {ROLES.map(r => {
            const granted = has(r, p.key);
            return (
              <td
                key={r.key}
                className={cn(
                  "text-center px-3 py-2",
                  granted ? "text-emerald-600" : "text-gray-300"
                )}
              >
                {granted ? <Check className="w-4 h-4 inline" /> : <Minus className="w-4 h-4 inline" />}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/* ---------- APPROVAL LAYERS ---------- */

function LayersTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="font-medium text-gray-900">How loan approvals route</div>
        <p className="text-sm text-gray-500 mt-1">
          Each loan moves through every layer below in sequence — but only the layers whose
          threshold is reached become required. Higher-tier approvers cannot disburse, and the
          originating Credit Officer cannot approve their own application
          <span className="text-gray-700 font-medium"> (separation of duties)</span>.
        </p>
      </Card>

      <div className="space-y-3">
        {APPROVAL_LAYERS.map((layer, idx) => {
          const isLast = idx === APPROVAL_LAYERS.length - 1;
          return (
            <div key={layer.level}>
              <Card className="!p-0">
                <div className="flex items-stretch">
                  <div className="w-16 bg-brand-50 flex flex-col items-center justify-center text-brand-700">
                    <div className="text-[10px] font-medium uppercase">Layer</div>
                    <div className="text-2xl font-bold">{layer.level}</div>
                  </div>
                  <div className="flex-1 px-5 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{layer.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{layer.description}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          <Users className="w-3 h-3" />
                          {layer.role}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div>
                        <span className="text-gray-500">Activates above </span>
                        <span className="font-medium text-gray-900">{fmt$(layer.min)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Approves up to </span>
                        <span className="font-medium text-gray-900">{fmt$(layer.max)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              {!isLast && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-4 bg-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Maker–checker enforced</div>
            <div className="text-gray-600 mt-0.5">
              The user who creates / reviews an application cannot also approve or disburse it.
              Disbursement is restricted to the Cashier role.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
