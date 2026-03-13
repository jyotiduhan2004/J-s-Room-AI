"use client";

type Props = {
  isConnected: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  onToggleSession: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
};

export default function ControlBar({
  isConnected,
  isCameraOn,
  isMicOn,
  onToggleSession,
  onToggleCamera,
  onToggleMic,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-3 p-4">
      {/* Mic toggle */}
      <button
        onClick={onToggleMic}
        disabled={!isConnected}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          !isConnected
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : isMicOn
              ? "bg-zinc-700 text-white hover:bg-zinc-600"
              : "bg-red-600 text-white hover:bg-red-500"
        }`}
        title={isMicOn ? "Mute mic" : "Unmute mic"}
      >
        {isMicOn ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
            <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07A7 7 0 0019 11z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M19 11a1 1 0 10-2 0 4.98 4.98 0 01-.68 2.52l1.45 1.45A6.96 6.96 0 0019 11zM12 14a3 3 0 003-3V5a3 3 0 00-6 0v6c0 .35.06.69.18 1l4.56 4.56c.08-.01.17-.02.26-.03zM3.71 3.29a1 1 0 00-1.42 1.42l5.01 5.01A2.98 2.98 0 007 11a5 5 0 005 5c.38 0 .75-.04 1.1-.13l1.53 1.53A6.95 6.95 0 0112 18a7 7 0 01-7-7 1 1 0 10-2 0 9 9 0 008 8.94V22H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.06a8.96 8.96 0 003.46-1.33l3.83 3.83a1 1 0 001.42-1.42L3.71 3.29z" />
          </svg>
        )}
      </button>

      {/* Start/Stop session */}
      <button
        onClick={onToggleSession}
        className={`px-6 py-3 rounded-full font-medium text-sm transition-colors ${
          isConnected
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        {isConnected ? "End Session" : "Start Design Session"}
      </button>

      {/* Camera toggle */}
      <button
        onClick={onToggleCamera}
        disabled={!isConnected}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          !isConnected
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : isCameraOn
              ? "bg-zinc-700 text-white hover:bg-zinc-600"
              : "bg-red-600 text-white hover:bg-red-500"
        }`}
        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraOn ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4V7a1 1 0 00-1-1z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.27 2L2 3.27 4.73 6H4a1 1 0 00-1 1v10a1 1 0 001 1h12c.2 0 .39-.06.55-.16L19.73 21 21 19.73M21 6.5l-4 4V7a1 1 0 00-1-1H9.82L21 17.18V6.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
