"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type Props = {
  isActive: boolean;
  onFrame: (base64: string) => void;
  /** Seconds between frames (default 3 = one frame every 3s to save tokens) */
  intervalSec?: number;
};

export default function CameraFeed({ isActive, onFrame, intervalSec = 3 }: Props) {
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

    // Small resolution + low quality = tiny payload = fewer tokens
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
    const base64 = dataUrl.split(",")[1];
    onFrame(base64);
  }, [onFrame]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { width: 640, height: 480, facingMode: "environment" },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Send one frame immediately, then at interval
        captureFrame();
        intervalRef.current = setInterval(captureFrame, intervalSec * 1000);
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
      });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, intervalSec, captureFrame]);

  if (!mounted) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <p className="text-zinc-500 text-sm">Camera off</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <p className="text-zinc-500 text-sm">Camera off</p>
        </div>
      )}
      {isActive && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
