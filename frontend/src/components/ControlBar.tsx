"use client";

type Props = {
  isConnected: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isConnecting?: boolean;
  onToggleSession: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
};

export default function ControlBar({
  isConnected,
  isCameraOn,
  isMicOn,
  isConnecting,
  onToggleSession,
  onToggleCamera,
  onToggleMic,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        disabled={!isConnected}
        title={isMicOn ? "Mute mic" : "Unmute mic"}
        className={`size-10 flex items-center justify-center rounded-full transition-all ${
          !isConnected
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : isMicOn
            ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur"
            : "bg-red-500/80 hover:bg-red-500 text-white backdrop-blur"
        }`}
      >
        <span className="material-symbols-outlined !text-xl">
          {isMicOn ? "mic" : "mic_off"}
        </span>
      </button>

      {/* Start / Stop session */}
      <button
        onClick={onToggleSession}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
          isConnected
            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
            : isConnecting
            ? "bg-primary/60 text-white cursor-wait shadow-primary/20"
            : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
        }`}
      >
        <span className="material-symbols-outlined !text-lg">
          {isConnected ? "stop_circle" : isConnecting ? "progress_activity" : "radio_button_checked"}
        </span>
        {isConnected ? "End Session" : isConnecting ? "Connecting..." : "Start Session"}
      </button>

      {/* Camera toggle */}
      <button
        onClick={onToggleCamera}
        disabled={!isConnected}
        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
        className={`size-10 flex items-center justify-center rounded-full transition-all ${
          !isConnected
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : isCameraOn
            ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur"
            : "bg-red-500/80 hover:bg-red-500 text-white backdrop-blur"
        }`}
      >
        <span className="material-symbols-outlined !text-xl">
          {isCameraOn ? "videocam" : "videocam_off"}
        </span>
      </button>
    </div>
  );
}
