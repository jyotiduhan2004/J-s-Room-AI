"use client";

type Status = "offline" | "connecting" | "listening" | "speaking";

type Props = {
  status: Status;
};

export default function StatusIndicator({ status }: Props) {
  if (status === "offline") return null;

  const config = {
    connecting: {
      bg: "bg-yellow-500/15",
      ring: "ring-yellow-500/30",
      dot: "bg-yellow-400",
      label: "Connecting...",
      icon: (
        <span className="material-symbols-outlined !text-base animate-spin text-yellow-400">
          progress_activity
        </span>
      ),
    },
    listening: {
      bg: "bg-primary/15",
      ring: "ring-primary/30",
      dot: "bg-primary",
      label: "Listening",
      icon: (
        <span className="material-symbols-outlined !text-base text-primary">
          mic
        </span>
      ),
    },
    speaking: {
      bg: "bg-primary/15",
      ring: "ring-primary/30",
      dot: "bg-primary",
      label: "AI Speaking",
      icon: (
        <span className="material-symbols-outlined !text-base text-primary">
          volume_up
        </span>
      ),
    },
  };

  const c = config[status];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg} ring-1 ${c.ring} backdrop-blur-sm`}
    >
      {/* Animated dot */}
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-60`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
      </span>

      {c.icon}

      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {c.label}
      </span>

      {/* Waveform bars for speaking/listening */}
      {(status === "speaking" || status === "listening") && (
        <div className="flex items-end gap-[2px] h-3.5 ml-0.5">
          <span className="w-[3px] bg-primary rounded-full animate-audio-bar-1" />
          <span className="w-[3px] bg-primary rounded-full animate-audio-bar-2" />
          <span className="w-[3px] bg-primary rounded-full animate-audio-bar-3" />
          <span className="w-[3px] bg-primary rounded-full animate-audio-bar-4" />
        </div>
      )}
    </div>
  );
}
