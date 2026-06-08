"use client";

import { PageHeader } from "@/components/page-header";
import { Phone, Mail, MessageCircle } from "lucide-react";

const FAQS = [
  {
    q: "How do I reset a customer's PIN?",
    a: 'Open the customer’s profile and click "Change pin" in the header. PINs are 4 digits.',
  },
  {
    q: "How do I create a new staff role?",
    a: "Go to Settings → User & Role Management → Roles → Create role, then pick the permissions to grant.",
  },
  {
    q: "How do I configure the loan application flow?",
    a: "Settings → Apply Loan Setting lets you toggle pages and individual fields for the MWL and Non-MWL flows.",
  },
  {
    q: "Why can't I see some menus?",
    a: "Menu visibility depends on your role's permissions. Ask an admin to adjust your role if you need more access.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-[900px]">
      <PageHeader
        title="Help & support"
        subtitle="Find quick answers or reach our support team."
      />

      {/* Contact channels */}
      <div className="grid grid-cols-3 gap-4">
        <ContactCard
          icon={Phone}
          title="Call support"
          value="+855 23 900 000"
          note="Mon–Fri, 8am–5pm"
        />
        <ContactCard
          icon={Mail}
          title="Email us"
          value="support@weloan365.com"
          note="Replies within 1 business day"
        />
        <ContactCard
          icon={MessageCircle}
          title="Live chat"
          value="Start a chat"
          note="Available during office hours"
        />
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="px-6 py-4 border-b border-gray-200 text-base font-semibold text-gray-900">
          Frequently asked questions
        </div>
        <div className="divide-y divide-gray-100">
          {FAQS.map(f => (
            <div key={f.q} className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900">{f.q}</div>
              <div className="text-sm text-gray-600 mt-1">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{note}</div>
    </div>
  );
}
