"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("laybunnavitou@kosign.com.kh");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // Prototype: any click on Sign in grants access to the main page.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    router.push("/");
  };

  const goToMain = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => router.push("/"), 700);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white flex-col p-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center font-bold">
            W
          </div>
          <span className="font-semibold">WeLoan365</span>
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure admin access
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight leading-tight">
            Loan operations,
            <br />
            made simple.
          </h2>
          <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
            Review applications, run KYC, disburse loans, and monitor your portfolio — all in one clean workspace.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm">
            <Stat value="1,284" label="Active loans" />
            <Stat value="$4.82M" label="Portfolio" />
            <Stat value="1.79%" label="PAR 30" />
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © 2026 KoSign Microfinance Plc. All rights reserved.
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              W
            </div>
            <span className="font-semibold text-gray-900">WeLoan365</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your admin account to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={goToMain}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-wait"
            >
              <GoogleIcon />
              Continue with Google SSO
            </button>
          </form>

          <div className="mt-8 text-xs text-gray-500 text-center">
            Protected by 2FA · Need access?{" "}
            <a className="text-brand-600 hover:underline font-medium" href="mailto:admin@kosign.com.kh">
              Contact admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
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

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11a6.57 6.57 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0012 1a11 11 0 00-9.82 6.05l3.67 2.84C6.72 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
