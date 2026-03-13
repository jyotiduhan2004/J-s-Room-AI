"use client";

type Status = "offline" | "connecting" | "listening" | "speaking";

type Props = {
  status: Status;
};

export default function StatusIndicator({ status }: Props) {
  if (status === "offline") return null;

  const config = {
    connecting: {
      bg: "bg-yellow-500/20",
      ring: "ring-yellow-500/40",
      dot: "bg-yellow-500",
      pulse: "animate-pulse",
      label: "Connecting...",
      icon: (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
      ),
    },
    listening: {
      bg: "bg-emerald-500/20",
      ring: "ring-emerald-500/40",
      dot: "bg-emerald-500",
      pulse: "",
      label: "Listening...",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
          <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07A7 7 0 0019 11z" />
        </svg>
      ),
    },
    speaking: {
      bg: "bg-violet-500/20",
      ring: "ring-violet-500/40",
      dot: "bg-violet-500",
      pulse: "",
      label: "AI Speaking...",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.51 8.51 0 0014 3.23z" />
        </svg>
      ),
    },
  };

  const c = config[status];

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full ${c.bg} ring-1 ${c.ring} backdrop-blur-sm`}>
      {/* Animated dot */}
      <span className="relative flex h-2.5 w-2.5">
        {status === "listening" && (
          <span className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-75`} />
        )}
        {status === "speaking" && (
          <span className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot} ${c.pulse}`} />
      </span>

      {/* Icon */}
      <span className="text-white/80">{c.icon}</span>

      {/* Label */}
      <span className="text-xs font-medium text-white/80">{c.label}</span>

      {/* Audio bars animation for speaking */}
      {status === "speaking" && (
        <div className="flex items-end gap-[2px] h-3.5 ml-0.5">
          <span className="w-[3px] bg-violet-400 rounded-full animate-audio-bar-1" />
          <span className="w-[3px] bg-violet-400 rounded-full animate-audio-bar-2" />
          <span className="w-[3px] bg-violet-400 rounded-full animate-audio-bar-3" />
          <span className="w-[3px] bg-violet-400 rounded-full animate-audio-bar-4" />
        </div>
      )}

      {/* Listening waves animation */}
      {status === "listening" && (
        <div className="flex items-end gap-[2px] h-3.5 ml-0.5">
          <span className="w-[3px] bg-emerald-400 rounded-full animate-audio-bar-1" />
          <span className="w-[3px] bg-emerald-400 rounded-full animate-audio-bar-2" />
          <span className="w-[3px] bg-emerald-400 rounded-full animate-audio-bar-3" />
          <span className="w-[3px] bg-emerald-400 rounded-full animate-audio-bar-4" />
        </div>
      )}
    </div>
  );
}
