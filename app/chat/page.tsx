"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Paperclip, Send, ArrowLeft, ShieldCheck, Users, UserRound } from "lucide-react";
import { CHATS, CUSTOMERS } from "@/lib/data";
import { useRole } from "@/lib/role-context";

type ChatMode = "team" | "mine";

export default function ChatPage() {
  const { user, role } = useRole();
  const [active, setActive] = useState(CHATS[0]);
  // On mobile the two panes can't sit side by side, so we show one at a time:
  // the conversation list, or the open thread. Desktop shows both.
  const [mobileThread, setMobileThread] = useState(false);
  // Reply identity: "team" → all replies go out as NHFC Support (shared inbox);
  // "mine" → the officer replies under their own name (1:1 conversation).
  const [mode, setMode] = useState<ChatMode>("team");
  const initials = user.name.split(" ").map(s => s[0]).join("");
  // Link the conversation to the customer's profile when we can match it.
  const activeCustomer = CUSTOMERS.find(c => c.name === active.customer);
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
      {/* Mode toggle — switch the reply identity */}
      <div className="inline-flex self-start rounded-lg border border-gray-200 bg-white p-0.5 shadow-card">
        <button
          onClick={() => setMode("team")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition ${
            mode === "team" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Users className="w-4 h-4" />
          Support inbox
        </button>
        <button
          onClick={() => setMode("mine")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition ${
            mode === "mine" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <UserRound className="w-4 h-4" />
          My chats
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 flex flex-1 min-h-0 overflow-hidden shadow-card">
      <aside
        className={`w-full lg:w-80 border-r border-gray-200 flex-col ${
          mobileThread ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-gray-900">
            {mode === "team" ? "Support inbox" : "My chats"}
          </div>
          <span className="text-xs text-gray-500">
            {CHATS.reduce((s, c) => s + c.unread, 0)} unread
          </span>
        </div>
        <input
          placeholder="Search conversations..."
          className="mx-3 my-2 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {CHATS.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c);
                setMobileThread(true);
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                active.id === c.id ? "bg-brand-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-900">{c.customer}</div>
                <div className="text-xs text-gray-400">{c.at}</div>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="text-xs text-gray-500 truncate max-w-[180px]">{c.last}</div>
                {c.unread > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-brand-600 text-white rounded-full">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section
        className={`flex-1 min-w-0 flex-col ${mobileThread ? "flex" : "hidden lg:flex"}`}
      >
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileThread(false)}
              className="p-1.5 -ml-1.5 rounded-md hover:bg-gray-100 text-gray-600 lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              {activeCustomer ? (
                <Link
                  href={`/customer/accounts/${activeCustomer.id}?from=chat`}
                  className="font-semibold text-gray-900 truncate block hover:text-brand-700 hover:underline"
                  title="View customer profile"
                >
                  {active.customer}
                </Link>
              ) : (
                <div className="font-semibold text-gray-900 truncate">{active.customer}</div>
              )}
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </div>
          {activeCustomer && (
            <Link
              href={`/customer/accounts/${activeCustomer.id}?from=chat`}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
              title="View customer profile"
            >
              <Info className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="flex-1 p-5 overflow-y-auto scrollbar-thin bg-gray-50 space-y-3">
          <div className="text-center text-xs text-gray-400">Today</div>
          <div className="flex">
            <div className="max-w-[80%] px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
              Hi, I applied for a personal loan yesterday.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] px-3 py-2 bg-brand-600 text-white rounded-lg text-sm">
              Hello {active.customer.split(" ")[0]}, thanks for reaching out. Your application is under review.
            </div>
          </div>
          <div className="flex">
            <div className="max-w-[80%] px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
              {active.last}
            </div>
          </div>
        </div>
        {/* Replying-as banner — identity depends on the selected mode. */}
        <div className="px-5 pt-3">
          {mode === "team" ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-brand-50/70 border border-brand-100 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                NS
              </div>
              <div className="min-w-0 text-[11px] leading-snug text-gray-600">
                <span className="font-medium text-gray-900 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-brand-600" />
                  Replying as NHFC Support
                </span>
                <span className="text-gray-500">
                  {" "}— the customer sees this team name, not your personal name.
                </span>
                <span className="text-gray-400"> Handled by {user.name}.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 text-[11px] leading-snug text-gray-600">
                <span className="font-medium text-gray-900 inline-flex items-center gap-1">
                  <UserRound className="w-3 h-3 text-gray-500" />
                  Replying as {user.name}
                </span>
                <span className="text-gray-500">
                  {" "}· {role.name} — the customer sees your name and photo.
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            placeholder={mode === "team" ? "Reply as NHFC Support…" : `Reply as ${user.name.split(" ")[0]}…`}
            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-700 font-medium">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
