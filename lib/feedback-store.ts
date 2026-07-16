"use client";

import { useSyncExternalStore } from "react";
import { FEEDBACK } from "./data";

/** Officers can edit a reply for this many hours after it was first sent. */
export const REPLY_EDIT_WINDOW_HOURS = 12;

export type FeedbackResponse = {
  message: string;
  sentAt: string;
  /** When the reply was first sent — fixed, doesn't move on later edits. Anchors the 12h edit window. */
  repliedAt: string;
  /** Officer who made the most recent reply/edit. */
  by?: string;
};

/* Parse "2026-04-21 09:12" or "2026-04-21" into a sortable timestamp. */
export function parseTs(s: string): number {
  if (!s) return 0;
  const isoish = s.includes(" ") ? s.replace(" ", "T") : s;
  const n = Date.parse(isoish);
  return Number.isFinite(n) ? n : 0;
}

export function withinReplyEditWindow(repliedAt: string): boolean {
  const hours = (Date.now() - parseTs(repliedAt)) / 3_600_000;
  return hours < REPLY_EDIT_WINDOW_HOURS;
}

/**
 * Shared, in-memory store for officer replies to customer feedback.
 *
 * Both the Consult & Feedback inbox and the customer detail page read and write
 * through this store so a reply made on one screen shows up on the other —
 * "the feedback table and the customer detail stay the same and consistent."
 *
 * Seeded from the static FEEDBACK data. There's no backend in the prototype, so
 * the store lives in module memory: it persists across client-side navigation
 * but resets on a full page reload.
 */
// FB-028 is the flagship "recent reply" example — seeded as sent an hour ago
// so it loads inside the edit window and demonstrates the Edit response flow.
const RECENT_DEMO_ID = "FB-028";

let store: Record<string, FeedbackResponse> = Object.fromEntries(
  FEEDBACK.filter(f => f.response).map(f => {
    const isRecentDemo = f.id === RECENT_DEMO_ID;
    const sentAt = isRecentDemo
      ? new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ")
      : f.date;
    return [f.id, { message: f.response!, sentAt, repliedAt: sentAt, by: "Support team" }];
  })
);

const listeners = new Set<() => void>();

export function setFeedbackResponse(id: string, message: string, sentAt: string, by?: string) {
  // First reply anchors the edit window; later edits keep that anchor.
  const repliedAt = store[id]?.repliedAt ?? sentAt;
  // Replace the object reference so useSyncExternalStore detects the change.
  store = { ...store, [id]: { message, sentAt, repliedAt, by } };
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return store;
}

export function useFeedbackResponses() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Stamp "YYYY-MM-DD HH:MM" for the moment a reply is sent. */
export function nowStamp(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
