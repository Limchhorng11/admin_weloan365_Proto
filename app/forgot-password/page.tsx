"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

type Step = 1 | 2 | 3 | 4;

const STEPS: { key: Step; label: string }[] = [
  { key: 1, label: "Identify" },
  { key: 2, label: "Verify" },
  { key: 3, label: "New password" },
  { key: 4, label: "Done" },
];

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password state
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submitIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError("Enter your admin email address");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address");
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setCooldown(RESEND_COOLDOWN);
    setStep(2);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter all 6 digits");
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setStep(3);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
    setCooldown(RESEND_COOLDOWN);
    setOtp(Array(6).fill(""));
    otpRefs.current[0]?.focus();
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return setError("Password must be at least 8 characters");
    if (pwd !== confirm) return setError("Passwords don't match");
    if (passwordScore(pwd) < 2) return setError("Choose a stronger password");
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setStep(4);
  };

  const back = () => {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const otpChange = (idx: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[idx] = "";
      setOtp(next);
      return;
    }
    // Support paste of multiple digits into one box
    const chars = digits.slice(0, 6 - idx).split("");
    const next = [...otp];
    chars.forEach((c, i) => {
      if (idx + i < 6) next[idx + i] = c;
    });
    setOtp(next);
    const lastFilled = Math.min(idx + chars.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  const otpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/login" className="inline-block mb-8">
          <BrandLogo size={36} />
        </Link>

          {/* Stepper */}
          <Stepper currentStep={step} />

          {/* Back nav */}
          {step > 1 && step < 4 && (
            <button
              onClick={back}
              className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          {step === 1 && (
            <StepIdentify
              email={email}
              setEmail={setEmail}
              onSubmit={submitIdentify}
              loading={loading}
              error={error}
            />
          )}
          {step === 2 && (
            <StepOtp
              email={email}
              otp={otp}
              onChange={otpChange}
              onKey={otpKey}
              refs={otpRefs}
              onVerify={verifyOtp}
              onResend={resend}
              cooldown={cooldown}
              loading={loading}
              error={error}
            />
          )}
          {step === 3 && (
            <StepNewPassword
              pwd={pwd}
              setPwd={setPwd}
              confirm={confirm}
              setConfirm={setConfirm}
              showPwd={showPwd}
              setShowPwd={setShowPwd}
              onSubmit={submitNewPassword}
              loading={loading}
              error={error}
            />
          )}
          {step === 4 && (
            <StepDone onGoToLogin={() => router.push("/login")} />
          )}

          <div className="mt-8 text-xs text-gray-500 text-center">
            Remembered your password?{" "}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              Back to sign in
            </Link>
          </div>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

function StepIdentify({
  email,
  setEmail,
  onSubmit,
  loading,
  error,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
        Forgot your password?
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Enter your admin email and we&apos;ll send you a 6-digit code to reset it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Admin email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@nonghyup.com.kh"
              autoComplete="email"
              required
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {error && <ErrorBox message={error} />}

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
              Sending...
            </>
          ) : (
            <>
              Send code
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

function StepOtp({
  email,
  otp,
  onChange,
  onKey,
  refs,
  onVerify,
  onResend,
  cooldown,
  loading,
  error,
}: {
  email: string;
  otp: string[];
  onChange: (idx: number, v: string) => void;
  onKey: (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onVerify: () => void;
  onResend: () => void;
  cooldown: number;
  loading: boolean;
  error: string | null;
}) {
  const complete = otp.every(d => d !== "");

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
        Enter the 6-digit code
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        We sent it to <span className="font-medium text-gray-800">{maskEmail(email)}</span>.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex gap-2 justify-between">
          {otp.map((v, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              value={v}
              onChange={e => onChange(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              inputMode="numeric"
              maxLength={6}
              className="w-11 h-12 text-center text-lg font-mono font-medium border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          ))}
        </div>

        <div className="text-xs text-gray-500">
          Didn&apos;t get it?{" "}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button
              onClick={onResend}
              className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Resend code
            </button>
          )}
        </div>

        {error && <ErrorBox message={error} />}

        <button
          onClick={onVerify}
          disabled={loading || !complete}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition",
            loading || !complete
              ? "bg-brand-600/50 text-white cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify code
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </>
  );
}

function StepNewPassword({
  pwd,
  setPwd,
  confirm,
  setConfirm,
  showPwd,
  setShowPwd,
  onSubmit,
  loading,
  error,
}: {
  pwd: string;
  setPwd: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  showPwd: boolean;
  setShowPwd: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  const score = passwordScore(pwd);
  const match = confirm.length > 0 && pwd === confirm;
  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
        Set a new password
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Choose something you haven&apos;t used before.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            New password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type={showPwd ? "text" : "password"}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
              aria-label={showPwd ? "Hide" : "Show"}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <StrengthMeter score={score} value={pwd} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
              className={cn(
                "w-full pl-9 pr-10 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2",
                confirm.length === 0
                  ? "border-gray-200 focus:ring-brand-500/20 focus:border-brand-500"
                  : match
                    ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                    : "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
              )}
            />
            {confirm.length > 0 && match && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {error && <ErrorBox message={error} />}

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
              Resetting...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

function StepDone({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <div className="text-center mt-6">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
        Password reset
      </h1>
      <p className="text-sm text-gray-500 mt-1.5">
        You can now sign in with your new password.
      </p>
      <button
        onClick={onGoToLogin}
        className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm bg-brand-600 text-white hover:bg-brand-700"
      >
        Go to sign in
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = s.key < currentStep;
        const active = s.key === currentStep;
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0",
                  done && "bg-brand-600 text-white",
                  active && "bg-brand-100 text-brand-700 ring-2 ring-brand-600",
                  !done && !active && "bg-gray-100 text-gray-500"
                )}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.key}
              </div>
              <div
                className={cn(
                  "text-[11px] font-medium hidden sm:block",
                  active ? "text-brand-700" : done ? "text-gray-700" : "text-gray-400"
                )}
              >
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px",
                  s.key < currentStep ? "bg-brand-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StrengthMeter({ score, value }: { score: number; value: string }) {
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = ["bg-rose-500", "bg-rose-400", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              value.length > 0 && i < score ? colors[score] : "bg-gray-100"
            )}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className={cn("font-medium", value.length === 0 ? "text-gray-400" : "text-gray-700")}>
          {value.length === 0 ? "8+ characters with letters, numbers & symbols" : labels[score]}
        </span>
        <span className="text-gray-400">{value.length}/64</span>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
      {message}
    </div>
  );
}

/* ---------- helpers ---------- */

function passwordScore(p: string): number {
  let s = 0;
  if (p.length >= 8) s += 1;
  if (p.length >= 12) s += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  return Math.min(4, s);
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}
