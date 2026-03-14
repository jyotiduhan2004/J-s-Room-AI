"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/gemini-live";

type Props = {
  transcript: TranscriptEntry[];
};

function formatTime(timestamp: number): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel({ transcript }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* AI Insight placeholder */}
        <div className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined !text-base text-primary">lightbulb</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              AI Insight
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Start a session — your AI interior designer will analyze your room and guide you through a redesign.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* AI Insight card — shown once conversation starts */}
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="material-symbols-outlined !text-base text-primary">lightbulb</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            AI Insight
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Listening to your space. Ask about styles, colors, or furniture to get started.
        </p>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {transcript.map((entry, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${
              entry.role === "agent" ? "items-end ml-auto" : "items-start"
            }`}
          >
            {/* Bubble */}
            <div
              className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                entry.role === "agent"
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none"
              }`}
            >
              {entry.text}
            </div>

            {/* Time + label */}
            <div className={`flex items-center gap-1 mt-1 ${entry.role === "agent" ? "mr-1" : "ml-1"}`}>
              {entry.role === "agent" && (
                <span className="material-symbols-outlined !text-[10px] text-primary">check_circle</span>
              )}
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-tighter">
                {entry.role === "agent" ? "AI Assistant" : "You"}
              </span>
              {entry.timestamp > 0 && (
                <span className="text-[10px] text-slate-400">· {formatTime(entry.timestamp)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
