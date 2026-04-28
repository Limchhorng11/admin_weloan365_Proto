"use client";

import { useState } from "react";
import { Phone, Info, Paperclip, Send } from "lucide-react";
import { CHATS } from "@/lib/data";

export default function ChatPage() {
  const [active, setActive] = useState(CHATS[0]);
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex h-[calc(100vh-8rem)] overflow-hidden shadow-card">
      <aside className="w-80 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Chats</div>
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
              onClick={() => setActive(c)}
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

      <section className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">{active.customer}</div>
            <div className="text-xs text-gray-500">Online • {active.id}</div>
          </div>
          <div className="flex gap-1">
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-5 overflow-y-auto scrollbar-thin bg-gray-50 space-y-3">
          <div className="text-center text-xs text-gray-400">Today</div>
          <div className="flex">
            <div className="max-w-sm px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
              Hi, I applied for a personal loan yesterday.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-sm px-3 py-2 bg-brand-600 text-white rounded-lg text-sm">
              Hello {active.customer.split(" ")[0]}, thanks for reaching out. Your application is under review.
            </div>
          </div>
          <div className="flex">
            <div className="max-w-sm px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
              {active.last}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-700 font-medium">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
