"use client";

type Props = {
  role: "user" | "agent" | "system";
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  attachmentSrc?: string;
};

function formatTime(timestamp: number): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessage({ role, text, timestamp, isStreaming, attachmentSrc }: Props) {
  if (role === "system") {
    return (
      <div className="flex justify-center py-2 animate-slide-up">
        <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {text}
        </p>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div
      className={`flex flex-col max-w-[85%] animate-slide-up ${
        isUser ? "items-end ml-auto" : "items-start"
      }`}
    >
      {/* Attachment */}
      {attachmentSrc && (
        <div className="mb-1.5">
          <img
            src={attachmentSrc}
            alt="Attached room photo"
            className="w-32 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm"
        }`}
      >
        {!isUser && (
          <span className="material-symbols-outlined !text-xs text-primary mr-1 align-middle">auto_awesome</span>
        )}
        {text}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm align-middle" />
        )}
      </div>

      {/* Metadata */}
      <div className={`flex items-center gap-1 mt-1 ${isUser ? "mr-1" : "ml-1"}`}>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          {isUser ? "You" : "AI Designer"}
        </span>
        {timestamp > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            &middot; {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
