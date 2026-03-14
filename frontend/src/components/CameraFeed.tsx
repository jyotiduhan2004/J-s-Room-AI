"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type Props = {
  isActive: boolean;
  onCapture: (base64: string, mimeType: string) => void;
};

export default function CameraFeed({ isActive, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [flash, setFlash] = useState(false);

  // Drag state
  const [position, setPosition] = useState({ x: 12, y: 12 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 960, facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera access denied:", err));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    onCapture(base64, "image/jpeg");
  }, [onCapture]);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-drag-handle]")) return;

    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    e.preventDefault();
    const dx = dragRef.current.startX - e.clientX;
    const dy = dragRef.current.startY - e.clientY;
    const newX = Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.startPosY + dy));
    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  if (!mounted || !isActive) return null;

  // Responsive sizes: smaller on mobile
  const width = expanded ? 280 : 144;
  const height = expanded ? 210 : 108;
  const smWidth = expanded ? 320 : 176;
  const smHeight = expanded ? 240 : 132;

  return (
    <div
      ref={containerRef}
      className="fixed z-40 rounded-xl overflow-hidden shadow-2xl border border-slate-300/50 dark:border-slate-700/50 bg-black transition-[width,height] duration-200"
      style={{
        right: position.x,
        bottom: position.y,
        width: `clamp(${width}px, 25vw, ${smWidth}px)`,
        height: `clamp(${height}px, 19vw, ${smHeight}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-10 animate-fade-in" />}

      {/* Top bar — drag handle + controls */}
      <div
        data-drag-handle
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 sm:py-1.5 bg-gradient-to-b from-black/60 to-transparent cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-1 px-1 py-0.5">
          <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white">Camera</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={expanded ? "Minimize" : "Expand"}
          >
            <span className="material-symbols-outlined !text-xs sm:!text-sm">
              {expanded ? "close_fullscreen" : "open_in_full"}
            </span>
          </button>
        </div>
      </div>

      {/* Capture button — bottom center */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCapture();
          }}
          className="group relative size-8 sm:size-10 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-sm hover:bg-white/40 active:scale-90 transition-all flex items-center justify-center"
          title="Capture room photo"
        >
          <div className="size-5 sm:size-7 rounded-full bg-white group-hover:bg-white/90 transition-colors" />
        </button>
      </div>
    </div>
  );
}
