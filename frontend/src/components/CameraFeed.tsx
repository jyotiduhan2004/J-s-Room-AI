"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type Props = {
  isActive: boolean;
  onFrame: (base64: string) => void;
  isSpeaking?: boolean;
  intervalSec?: number;
};

export default function CameraFeed({
  isActive,
  onFrame,
  isSpeaking = false,
  intervalSec = 5,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
    onFrame(dataUrl.split(",")[1]);
  }, [onFrame]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        captureFrame();
        intervalRef.current = setInterval(captureFrame, intervalSec * 1000);
      })
      .catch((err) => console.error("Camera access denied:", err));

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    };
  }, [isActive, intervalSec, captureFrame]);

  if (!mounted) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600 !text-5xl">videocam_off</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden glass-panel shadow-xl group">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera off overlay */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90">
          <span className="material-symbols-outlined text-slate-600 !text-5xl">videocam_off</span>
          <p className="text-xs text-slate-500 font-medium">Camera off</p>
        </div>
      )}

      {/* Bottom gradient */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
      )}

      {/* LIVE badge — top left */}
      {isActive && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <div className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            Live Feed
          </span>
        </div>
      )}

      {/* Waveform bars — bottom center (when speaking) */}
      {isActive && isSpeaking && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8 pointer-events-none">
          <div className="w-1 bg-primary rounded-full animate-audio-bar-1" style={{ height: "12px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-2" style={{ height: "20px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-3" style={{ height: "8px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-4" style={{ height: "28px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-1" style={{ height: "16px" }} />
          <div className="w-1 bg-primary/60 rounded-full animate-audio-bar-2" style={{ height: "32px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-3" style={{ height: "24px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-4" style={{ height: "12px" }} />
          <div className="w-1 bg-primary/40 rounded-full animate-audio-bar-1" style={{ height: "20px" }} />
          <div className="w-1 bg-primary rounded-full animate-audio-bar-2" style={{ height: "8px" }} />
        </div>
      )}

      {/* Listening pulse ring */}
      {isActive && !isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm pointer-events-none">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-semibold text-primary tracking-wider">Listening</span>
        </div>
      )}
    </div>
  );
}
