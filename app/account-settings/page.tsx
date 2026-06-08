"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import { KeyRound } from "lucide-react";

export default function AccountSettingsPage() {
  const { user } = useRole();
  const [name, setName] = useState(user.name);
  const [lang, setLang] = useState("English");
  const [twoFA, setTwoFA] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader
        title="Account settings"
        subtitle="Manage your personal account preferences."
      />

      {/* Profile */}
      <Card title="Profile">
        <Field label="Display name" value={name} onChange={setName} />
        <Field label="Email" value={user.email} readOnly />
        <SelectField
          label="Language"
          value={lang}
          onChange={setLang}
          options={["English", "ខ្មែរ (Khmer)"]}
        />
      </Card>

      {/* Security */}
      <Card title="Security">
        <ToggleRow
          label="Two-factor authentication"
          desc="Require a one-time code when signing in."
          checked={twoFA}
          onChange={() => setTwoFA(v => !v)}
        />
        <div className="pt-3">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
            <KeyRound className="w-4 h-4 text-gray-500" />
            Change password
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications">
        <ToggleRow
          label="Email notifications"
          desc="Updates about applications and approvals."
          checked={emailNotif}
          onChange={() => setEmailNotif(v => !v)}
        />
        <ToggleRow
          label="Push notifications"
          desc="Real-time alerts inside the app."
          checked={pushNotif}
          onChange={() => setPushNotif(v => !v)}
        />
      </Card>

      <div className="flex justify-end">
        <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">
          Save changes
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={cn(
          "mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
          readOnly && "bg-gray-50 text-gray-600"
        )}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
      >
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative w-10 h-5 rounded-full transition flex-shrink-0",
          checked ? "bg-brand-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 bg-white rounded-full h-4 w-4 transition",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
