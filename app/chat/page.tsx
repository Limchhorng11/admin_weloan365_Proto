"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Info,
  Paperclip,
  Send,
  ArrowLeft,
  UserRound,
  Users,
  UserPlus,
  Check,
  CheckCheck,
  Lock,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Mic,
} from "lucide-react";
import {
  CHATS,
  CUSTOMERS,
  USERS,
  ROLES,
  SUPPORT_CHANNEL_AGENTS,
  type Chat,
  type ChatChannel,
  type ChatAttachment,
  type StaffUser,
} from "@/lib/data";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const SUPPORT_TEAM_NAME = "NHFC Support";

/** The two kinds of discussion, shown as separate groups in one inbox. */
const CHANNEL_META: { key: ChatChannel; label: string; icon: typeof Users }[] = [
  { key: "officer", label: "Officer chat", icon: UserRound },
  { key: "support", label: "Customer Support", icon: Users },
];

/** Staff who may be given a seat in the Customer Support channel: anyone whose
 *  role can open Chat at all. Admins are left out on purpose — they can
 *  already answer without holding a seat. */
const SUPPORT_ELIGIBLE_USERS = USERS.filter(u => {
  const r = ROLES.find(x => x.name === u.role);
  if (!r || r.permissions === "*") return false;
  return r.permissions.includes("chat.view");
});

/** Roles actually present among eligible staff — the choices in "Select role".
 *  Order follows first appearance in SUPPORT_ELIGIBLE_USERS. */
const ELIGIBLE_ROLES = Array.from(new Set(SUPPORT_ELIGIBLE_USERS.map(u => u.role)));

export default function ChatPage() {
  const { user, can } = useRole();
  // Who may hand out seats in the support channel (Admin, via "*").
  const canManageChannel = can("chat.support_assign");
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(CHATS[0].id);
  // On mobile the two panes can't sit side by side, so we show one at a time:
  // the conversation list, or the open thread. Desktop shows both.
  const [mobileThread, setMobileThread] = useState(false);
  // Who may see and reply in the shared support channel.
  const [agents, setAgents] = useState<string[]>(SUPPORT_CHANNEL_AGENTS);

  // "Assign officer" opens a popover: pick a role, see that role's officers,
  // pick who answers — their name then shows up in the roster below.
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickRole, setPickRole] = useState("");
  const officersOfRole = pickRole
    ? SUPPORT_ELIGIBLE_USERS.filter(u => u.role === pickRole)
    : [];
  const toggleAssignment = (name: string) =>
    setAgents(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );

  /* You can read and reply to a conversation only if you're a party to it.
   * Admins run the channel but don't talk to customers — handing out seats is
   * not the same as holding one, and it doesn't grant a window into what was
   * said.
   *   officer chat → only the customer's own officer, nobody else
   *   support      → only officers holding a seat in the channel            */
  const canParticipate = (c: Chat) =>
    c.channel === "support"
      ? agents.includes(user.name)
      : c.assignee === user.name;

  /** Your inbox holds exactly the conversations you're a party to — no role is
   *  exempt. Someone else's customers never appear, not even greyed out. */
  const accessible = useMemo(
    () => chats.filter(canParticipate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chats, agents, user.name]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accessible;
    return accessible.filter(
      c => c.customer.toLowerCase().includes(q) || c.last.toLowerCase().includes(q)
    );
  }, [accessible, query]);

  // When the roster stands in for an empty Support group it already explains
  // the situation — don't stack a second "nothing here" message under it.
  const rosterShown =
    canManageChannel && !query.trim() && !visible.some(c => c.channel === "support");

  // Never leave a thread open that this role can't see.
  const active = accessible.find(c => c.id === activeId) ?? accessible[0];
  const activeCustomer = CUSTOMERS.find(c => c.name === active?.customer);
  const isSupport = active?.channel === "support";

  /* ---------- composer: text + an optional file/photo/video/voice attachment ---------- */
  const [draftText, setDraftText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordSecondsRef = useRef(0);

  useEffect(() => {
    if (!attachMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [attachMenuOpen]);

  // Tick the recording timer, and make sure the mic is released if the user
  // navigates away mid-recording.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      recordSecondsRef.current += 1;
      setRecordSeconds(recordSecondsRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [recording]);
  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  const attachFile = (kind: "image" | "video" | "file", file: File) => {
    setPendingAttachment({ kind, name: file.name, url: URL.createObjectURL(file), size: file.size });
    setAttachMenuOpen(false);
  };

  const removePendingAttachment = () => {
    if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.url);
    setPendingAttachment(null);
  };

  const startRecording = async () => {
    setAttachMenuOpen(false);
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setPendingAttachment({
          kind: "voice",
          name: "Voice message",
          url: URL.createObjectURL(blob),
          duration: recordSecondsRef.current,
        });
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recordSecondsRef.current = 0;
      setRecordSeconds(0);
      recorder.start();
      setRecording(true);
    } catch {
      setMicError("Microphone access is needed to record a voice message.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setRecording(false);
    setRecordSeconds(0);
  };

  const sendMessage = () => {
    if (!active) return;
    const text = draftText.trim();
    if (!text && !pendingAttachment) return;
    const at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const preview =
      text ||
      (pendingAttachment?.kind === "voice"
        ? "Voice message"
        : pendingAttachment?.kind === "image"
        ? "Photo"
        : pendingAttachment?.kind === "video"
        ? "Video"
        : pendingAttachment?.name ?? "");
    setChats(prev =>
      prev.map(c =>
        c.id === active.id
          ? {
              ...c,
              last: preview,
              at,
              messages: [
                ...c.messages,
                {
                  from: "staff",
                  text,
                  author: isSupport ? user.name : active.assignee,
                  at,
                  read: false,
                  attachment: pendingAttachment ?? undefined,
                },
              ],
            }
          : c
      )
    );
    setDraftText("");
    setPendingAttachment(null);
  };

  const totalUnread = accessible.reduce((s, c) => s + c.unread, 0);

  /* With no conversation to open AND nothing to manage, the list/thread split
   * is just a dead half — collapse it into one full-width section instead.
   * Admin still has the roster to manage, so Admin keeps the same two-pane
   * layout officers see (sidebar + thread), just with an empty inbox. */
  if (accessible.length === 0 && !canManageChannel) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden shadow-card">
          <div className="px-5 pt-4 pb-3.5 border-b border-gray-200">
            <div className="font-semibold text-gray-900">Conversations</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              None assigned to you
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-gray-50/40">
            <div className="mx-auto w-full max-w-2xl text-center py-10">
              <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-4 text-sm font-semibold text-gray-900">
                Nothing to show here
              </div>
              <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                Conversations are private to the people in them. You&apos;ll see one
                here once a customer is yours to answer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
      <div className="bg-white rounded-xl border border-gray-200 flex flex-1 min-h-0 overflow-hidden shadow-card">
        <aside
          className={cn(
            "w-full lg:w-[26rem] border-r border-gray-200 flex-col",
            mobileThread ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="px-4 pt-3.5 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-gray-900">Conversations</div>
              {/* A "0 unread" badge is noise — only speak up when there is one. */}
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-semibold">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {accessible.length === 0
                ? "None assigned to you"
                : `${accessible.length} assigned to you${
                    totalUnread > 0 ? ` · ${totalUnread} unread` : ""
                  }`}
            </div>
            <div className="relative mt-2.5">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* One inbox, grouped so the two kinds of discussion stay distinct. */}
            {CHANNEL_META.map(meta => {
              const group = visible.filter(c => c.channel === meta.key);
              // Keep the Support header even with nothing under it, so whoever
              // hands out seats can still reach the roster.
              const keepForRoster =
                meta.key === "support" && canManageChannel && !query.trim();
              // Keep Officer chat visible too (even empty) so it still reads
              // as the first section above Customer Support, not a missing one.
              const keepOfficerEmpty =
                meta.key === "officer" && canManageChannel && !query.trim();
              if (group.length === 0 && !keepForRoster && !keepOfficerEmpty) return null;
              return (
                <div key={meta.key}>
                  <div className="px-4 py-2 bg-gray-50/80 backdrop-blur-sm border-y border-gray-100 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 sticky top-0 z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <meta.icon className="w-3.5 h-3.5 text-gray-400" />
                      {meta.label}
                      {group.length > 0 && (
                        <span className="text-gray-400 font-normal normal-case tracking-normal">
                          ({group.length})
                        </span>
                      )}
                    </span>
                    {/* Admin-only: grant officers permission to this channel. */}
                    {meta.key === "support" && canManageChannel && (
                      <AssignOfficerPopover
                        open={assignOpen}
                        onOpenChange={setAssignOpen}
                        role={pickRole}
                        onRoleChange={setPickRole}
                        officersOfRole={officersOfRole}
                        agents={agents}
                        onToggle={toggleAssignment}
                      />
                    )}
                  </div>
                  {/* Nothing to read here, but the roster is the manager's job —
                      show who's answering instead of an empty strip. */}
                  {group.length === 0 && keepForRoster && (
                    <div className="p-3">
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50/60 border-b border-gray-100 text-[11px] font-medium text-gray-500">
                          Officers answering this channel
                          {agents.length > 0 && (
                            <span className="text-gray-400"> ({agents.length})</span>
                          )}
                        </div>
                        {agents.length === 0 ? (
                          <p className="p-3 text-xs text-gray-500">
                            Nobody assigned yet — use{" "}
                            <span className="font-medium text-gray-700">Assign officer</span>{" "}
                            above to choose someone.
                          </p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50/40 border-b border-gray-100">
                                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-500">
                                  Officer
                                </th>
                                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-500">
                                  Role
                                </th>
                                <th className="text-left px-3 py-1.5 text-[11px] font-medium text-gray-500">
                                  Branch
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {agents.map(a => {
                                const u = USERS.find(x => x.name === a);
                                return (
                                  <tr key={a} className="border-b border-gray-50 last:border-0">
                                    <td className="px-3 py-2 font-medium text-gray-900">
                                      {a}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {u?.role ?? "Customer Service"}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {u?.branch ?? "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <p className="mt-2.5 px-1 text-[11px] text-gray-400 leading-relaxed">
                        They answer every customer in this channel. Their conversations
                        stay private to them.
                      </p>
                    </div>
                  )}
                  {group.length === 0 && keepOfficerEmpty && (
                    <div className="px-4 py-6 text-center text-xs text-gray-500">
                      No officer conversations yet.
                    </div>
                  )}
                  {group.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveId(c.id);
                        setMobileThread(true);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50",
                        active?.id === c.id && "bg-brand-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-gray-900">{c.customer}</div>
                        <div className="text-xs text-gray-400">{c.at}</div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {c.last}
                        </div>
                        {c.unread > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-brand-600 text-white rounded-full">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
            {visible.length === 0 &&
              !rosterShown &&
              (query ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  No conversations match your search.
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  No conversations assigned to you.
                  <span className="block text-[11px] text-gray-400 mt-1">
                    {canManageChannel
                      ? "You manage who answers this channel, but you're not a party to any conversation."
                      : "You'll see a conversation here once a customer is yours to answer."}
                  </span>
                </div>
              ))}
          </div>
        </aside>

        <section
          className={cn(
            "flex-1 min-w-0 flex-col",
            mobileThread ? "flex" : "hidden lg:flex"
          )}
        >
          {!active ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/40">
              <div className="text-center max-w-[17rem]">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="mt-4 text-sm font-semibold text-gray-900">
                  Nothing to show here
                </div>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                  Conversations are private to the people in them. You only see the
                  ones you can answer yourself.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Support conversations aren't tied to one officer's own
                      customer relationship, so the profile shortcut doesn't
                      apply there. */}
                  {activeCustomer && !isSupport && (
                    <Link
                      href={`/customer/accounts/${activeCustomer.id}?from=chat`}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                      title="View customer profile"
                    >
                      <Info className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto scrollbar-thin bg-gray-50">
                <div className="text-center text-xs text-gray-400">Today</div>
                {active.messages.map((m, i) => {
                  const mine = m.from === "staff";
                  // Consecutive messages from the same side stack tighter and
                  // only the first one carries an avatar, like a real thread.
                  const grouped = active.messages[i - 1]?.from === m.from;
                  const lastFromStaff =
                    mine && !active.messages.slice(i + 1).some(x => x.from === "staff");
                  const who = mine
                    ? isSupport
                      ? m.author ?? SUPPORT_TEAM_NAME
                      : active.assignee ?? user.name
                    : active.customer;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-end gap-2",
                        mine ? "justify-end" : "justify-start",
                        grouped ? "mt-0.5" : "mt-3"
                      )}
                    >
                      {!mine && <Avatar show={!grouped} name={who} tone="customer" />}
                      <div
                        className={cn(
                          "flex flex-col max-w-[75%] min-w-0",
                          mine ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm",
                            mine
                              ? "bg-brand-600 text-white rounded-br-sm"
                              : "bg-white border border-gray-200 rounded-bl-sm"
                          )}
                        >
                          {m.attachment && (
                            <div className={cn(m.text && "mb-1.5")}>
                              {m.attachment.kind === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.attachment.url}
                                  alt={m.attachment.name}
                                  className="rounded-md max-w-[220px] max-h-[220px] object-cover"
                                />
                              ) : m.attachment.kind === "video" ? (
                                <video
                                  src={m.attachment.url}
                                  controls
                                  className="rounded-md max-w-[220px] max-h-[220px]"
                                />
                              ) : m.attachment.kind === "voice" ? (
                                <audio src={m.attachment.url} controls className="max-w-[220px]" />
                              ) : (
                                <a
                                  href={m.attachment.url}
                                  download={m.attachment.name}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                                    mine
                                      ? "bg-white/15 hover:bg-white/25"
                                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                  )}
                                >
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{m.attachment.name}</span>
                                </a>
                              )}
                            </div>
                          )}
                          {m.text}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                          {/* A shared inbox needs to show which colleague replied;
                              a 1:1 doesn't — there's only one person on each side. */}
                          {mine && isSupport && m.author && <span>{m.author} ·</span>}
                          {m.at && <span>{m.at}</span>}
                          {lastFromStaff &&
                            (m.read ? (
                              <span className="inline-flex items-center gap-0.5 text-brand-500">
                                <CheckCheck className="w-3 h-3" />
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                Sent
                              </span>
                            ))}
                        </div>
                      </div>
                      {mine && <Avatar show={!grouped} name={who} tone="staff" />}
                    </div>
                  );
                })}
              </div>

              {pendingAttachment && (
                <div className="px-5 pt-2">
                  <div className="inline-flex items-center gap-2 max-w-full pl-2 pr-1 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                    {pendingAttachment.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pendingAttachment.url}
                        alt=""
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    ) : pendingAttachment.kind === "voice" ? (
                      <Mic className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 truncate max-w-[220px]">
                      {pendingAttachment.kind === "voice"
                        ? `Voice message · ${formatDuration(pendingAttachment.duration ?? 0)}`
                        : pendingAttachment.name}
                    </span>
                    <button
                      onClick={removePendingAttachment}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0"
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {recording && (
                <div className="px-5 pt-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                    <span className="text-xs font-medium text-rose-700">
                      Recording… {formatDuration(recordSeconds)}
                    </span>
                    <button
                      onClick={stopRecording}
                      className="ml-auto px-2 py-1 text-xs font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    >
                      Stop
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {micError && (
                <div className="px-5 pt-2 text-[11px] text-rose-600">{micError}</div>
              )}

              <div className="px-5 py-3 flex items-center gap-2">
                <div ref={attachMenuRef} className="relative flex-shrink-0">
                  <button
                    onClick={() => setAttachMenuOpen(v => !v)}
                    className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                    title="Attach"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  {attachMenuOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-20">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        Photo or video
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Document
                      </button>
                      <button
                        onClick={startRecording}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Mic className="w-4 h-4 text-gray-400" />
                        Voice message
                      </button>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) attachFile(file.type.startsWith("video/") ? "video" : "image", file);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) attachFile("file", file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <input
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder={
                    isSupport
                      ? `Reply as ${SUPPORT_TEAM_NAME}…`
                      : `Reply as ${active.assignee}…`
                  }
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!draftText.trim() && !pendingAttachment}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition flex-shrink-0",
                    draftText.trim() || pendingAttachment
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function initialsOf(name: string) {
  return name.split(" ").map(s => s[0]).join("");
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "Assign officer" opens this as a centered dialog — pick a role, then pick
 *  one of that role's officers to answer Customer Support. Selecting one
 *  shows them right away in the roster below; the dialog stays open so more
 *  than one person can be picked in a row. */
function AssignOfficerPopover({
  open,
  onOpenChange,
  role,
  onRoleChange,
  officersOfRole,
  agents,
  onToggle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string;
  onRoleChange: (role: string) => void;
  officersOfRole: StaffUser[];
  agents: string[];
  onToggle: (name: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <>
      <button
        onClick={() => onOpenChange(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 shadow-sm transition flex-shrink-0"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Assign officer
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2 flex-shrink-0">
              <span className="text-sm font-semibold text-gray-900">
                Assign officer
              </span>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-4 flex-shrink-0">
              <select
                value={role}
                onChange={e => onRoleChange(e.target.value)}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-md pl-2.5 pr-8 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">Select role</option>
                {ELIGIBLE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {role && (
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-gray-500 mb-1.5">
                    {role} — select who answers
                  </div>
                  {officersOfRole.length === 0 ? (
                    <p className="text-xs text-gray-500">Nobody with this role yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {officersOfRole.map(u => {
                        const on = agents.includes(u.name);
                        return (
                          <button
                            key={u.id}
                            onClick={() => onToggle(u.name)}
                            className={cn(
                              "inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs font-medium transition",
                              on
                                ? "bg-brand-600 border-brand-600 text-white"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0",
                                on ? "bg-white/25 text-white" : "bg-brand-50 text-brand-700"
                              )}
                            >
                              {initialsOf(u.name)}
                            </span>
                            {u.name}
                            {on && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 flex-1 min-h-0 flex flex-col">
              <div className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
                Officers answering this channel
                {agents.length > 0 && (
                  <span className="text-gray-400 normal-case font-normal"> ({agents.length})</span>
                )}
              </div>
              {agents.length === 0 ? (
                <p className="px-4 pb-4 text-xs text-gray-500">
                  Nobody assigned yet — pick a role above.
                </p>
              ) : (
                <ul className="overflow-y-auto scrollbar-thin divide-y divide-gray-100 pb-1">
                  {agents.map(a => {
                    const u = USERS.find(x => x.name === a);
                    return (
                      <li key={a} className="flex items-center gap-2.5 px-4 py-2">
                        <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                          {initialsOf(a)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-gray-900 truncate">
                            {a}
                          </span>
                          <span className="block text-[11px] text-gray-500 truncate">
                            {u ? `${u.role} · ${u.branch}` : "Customer Service"}
                          </span>
                        </span>
                        <button
                          onClick={() => onToggle(a)}
                          title={`Remove ${a} from Customer Support`}
                          className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => onOpenChange(false)}
                className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/** Message avatar. Hidden (but still spaced) on grouped messages so the
 *  bubbles in a run stay aligned with the first one. */
function Avatar({
  show,
  name,
  tone,
}: {
  show: boolean;
  name: string;
  tone: "customer" | "staff";
}) {
  if (!show) return <span className="w-7 flex-shrink-0" aria-hidden />;
  return (
    <span
      title={name}
      className={cn(
        "w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center flex-shrink-0",
        tone === "staff" ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
