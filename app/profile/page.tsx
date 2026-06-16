"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useRole } from "@/lib/role-context";
import { PERMISSIONS } from "@/lib/data";
import { Mail, Building2, ShieldCheck, Crown, Camera, X } from "lucide-react";

const AVATAR_STORAGE_KEY = "admin-profile-avatar";

export default function ProfilePage() {
  const { user, role } = useRole();
  const initials = user.name.split(" ").map(s => s[0]).join("");

  // Profile photo — uploaded by the user and persisted locally (prototype:
  // no backend, so we keep the data URL in localStorage).
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved) setAvatar(saved);
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatar(url);
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, url);
      } catch {
        /* ignore */
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  const onRemovePhoto = () => {
    setAvatar(null);
    try {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const grantedCount =
    role.permissions === "*" ? PERMISSIONS.length : role.permissions.length;

  return (
    <div className="space-y-6 max-w-[900px]">
      <PageHeader title="My profile" subtitle="Your account and role details." />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title={avatar ? "Change profile photo" : "Upload a profile photo"}
              aria-label={avatar ? "Change profile photo" : "Upload a profile photo"}
              className="group relative block w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {avatar ? (
                <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full bg-brand-600 text-white flex items-center justify-center text-lg font-semibold">
                  {initials}
                </span>
              )}
              {/* Hover hint over the whole avatar */}
              <span className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center bg-black/50 text-white">
                <Camera className="w-4 h-4" />
              </span>
            </button>
            {/* Persistent camera badge so it's always clear the photo is editable */}
            <span
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-brand-600 text-white border-2 border-white flex items-center justify-center shadow-sm"
              aria-hidden="true"
            >
              <Camera className="w-3 h-3" />
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPhoto}
            />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {/* Explicit, labelled action so the upload affordance is obvious */}
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Camera className="w-3.5 h-3.5" />
                {avatar ? "Change photo" : "Upload a profile picture"}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
              {role.key === "admin" && <Crown className="w-3 h-3 text-amber-500" />}
              <ShieldCheck className="w-3 h-3" />
              {role.name}
            </span>
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Account */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Account
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Full name" value={user.name} />
            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {user.email}
                </span>
              }
            />
            <Row
              label="Branch"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {user.branch}
                </span>
              }
            />
            <Row label="Status" value={<StatusBadge status={user.status} />} />
            <Row label="Last active" value={user.lastActive} />
          </dl>
        </div>

        {/* Role & permissions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-4">
            Role &amp; permissions
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Role" value={role.name} />
            <Row label="Description" value={<span className="text-right">{role.description}</span>} />
            <Row label="Permissions" value={`${grantedCount} / ${PERMISSIONS.length} granted`} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 gap-4">
      <dt className="text-gray-500 text-sm flex-shrink-0">{label}</dt>
      <dd className="text-gray-900 text-sm text-right">{value}</dd>
    </div>
  );
}
