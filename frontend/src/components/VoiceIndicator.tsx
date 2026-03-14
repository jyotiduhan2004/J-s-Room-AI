"use client";

type Props = {
  state: "idle" | "listening" | "processing" | "speaking";
  isMicOn?: boolean;
};

export default function VoiceIndicator({ state, isMicOn }: Props) {
  if (state === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/25">
      {state === "listening" && (
        isMicOn ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-primary">Listening</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-primary/70">Waiting for your reply</span>
          </>
        )
      )}

      {state === "processing" && (
        <>
          <span className="material-symbols-outlined !text-xs sm:!text-sm text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-primary">Thinking</span>
        </>
      )}

      {state === "speaking" && (
        <>
          <div className="flex items-end gap-[2px] h-3 sm:h-3.5">
            <span className="w-[2px] sm:w-[3px] bg-primary rounded-full animate-audio-bar-1" />
            <span className="w-[2px] sm:w-[3px] bg-primary rounded-full animate-audio-bar-2" />
            <span className="w-[2px] sm:w-[3px] bg-primary rounded-full animate-audio-bar-3" />
            <span className="w-[2px] sm:w-[3px] bg-primary rounded-full animate-audio-bar-4" />
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-primary">Speaking</span>
        </>
      )}
    </div>
  );
}
