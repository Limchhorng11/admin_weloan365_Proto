"use client";

import { useSyncExternalStore } from "react";
import { FEEDBACK } from "./data";

export type FeedbackResponse = { message: string; sentAt: string };

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
let store: Record<string, FeedbackResponse> = Object.fromEntries(
  FEEDBACK.filter(f => f.response).map(f => [f.id, { message: f.response!, sentAt: f.date }])
);

const listeners = new Set<() => void>();

export function setFeedbackResponse(id: string, message: string, sentAt: string) {
  // Replace the object reference so useSyncExternalStore detects the change.
  store = { ...store, [id]: { message, sentAt } };
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
