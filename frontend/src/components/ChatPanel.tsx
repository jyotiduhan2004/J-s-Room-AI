"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/gemini-live";

type Props = {
  transcript: TranscriptEntry[];
};

export default function ChatPanel({ transcript }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm px-4 text-center">
        Start a session to begin your interior design conversation
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {transcript.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className={`max-w-[85%] ${entry.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
            {/* Role label */}
            <span className="text-[10px] font-medium tracking-wide uppercase text-zinc-500 px-1">
              {entry.role === "user" ? "You" : "J's Room AI"}
            </span>
            {/* Message bubble */}
            <div
              className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                entry.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
              }`}
            >
              {entry.text}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
