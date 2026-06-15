"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { ROLES, USERS, PERMISSIONS } from "@/lib/data";
import { ROLE_TO_USER, setActiveRole } from "@/lib/role-context";

// The four system roles, used to sign in as a given permission set (prototype).
const ROLE_OPTIONS = ROLES.map(r => ({
  key: r.key,
  name: r.name,
  permCount: r.permissions === "*" ? PERMISSIONS.length : r.permissions.length,
  email: USERS.find(u => u.name === ROLE_TO_USER[r.key])?.email ?? "",
}));
const TOTAL_PERMS = PERMISSIONS.length;

export default function LoginPage() {
  const router = useRouter();

  const [roleKey, setRoleKey]   = useState("admin");
  const [email, setEmail]       = useState(
    ROLE_OPTIONS.find(r => r.key === "admin")?.email ?? ""
  );
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // Selecting a role also fills its representative staff email.
  const selectRole = (key: string) => {
    setRoleKey(key);
    const opt = ROLE_OPTIONS.find(r => r.key === key);
    if (opt?.email) setEmail(opt.email);
  };

  // Prototype: sign in as the chosen role, then open the app with that role's
  // real permissions applied.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setActiveRole(roleKey);
    await new Promise(r => setTimeout(r, 700));
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <BrandLogo size={36} />
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to your admin account to continue.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Sign in as one of the system roles (applies its real permissions) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Sign in as
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {ROLE_OPTIONS.map(r => {
                const active = roleKey === r.key;
                return (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => selectRole(r.key)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition",
                      active
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        {r.key === "admin" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        {r.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {r.permCount}/{TOTAL_PERMS} permissions
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                aria-label={showPwd ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/30"
            />
            Remember me for 30 days
          </label>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition",
              loading
                ? "bg-brand-600/80 text-white cursor-wait"
                : "bg-brand-600 text-white hover:bg-brand-700"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-left">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>
    </div>
  );
}
