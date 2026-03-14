"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/gemini-live";
import ChatMessage from "./ChatMessage";

type Props = {
  transcript: TranscriptEntry[];
  isAiTyping?: boolean;
};

export default function ChatPanel({ transcript, isAiTyping }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isAiTyping]);

  if (transcript.length === 0 && !isAiTyping) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 !text-5xl">
          chat_bubble
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Upload a room photo or start talking to begin designing your space
        </p>
      </div>
    );
  }

  // Determine which message is currently streaming (last agent message with timestamp > 0)
  const lastIdx = transcript.length - 1;
  const lastEntry = transcript[lastIdx];
  const isLastStreaming =
    lastEntry && lastEntry.role === "agent" && lastEntry.timestamp > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
      {transcript.map((entry, i) => (
        <ChatMessage
          key={i}
          role={entry.role}
          text={entry.text}
          timestamp={entry.timestamp}
          isStreaming={i === lastIdx && isLastStreaming}
        />
      ))}

      {/* Typing indicator */}
      {isAiTyping && (
        <div className="flex items-start animate-slide-up">
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce-dot-1" />
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce-dot-2" />
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce-dot-3" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
