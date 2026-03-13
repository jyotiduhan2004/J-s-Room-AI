"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import CameraFeed from "@/components/CameraFeed";
import ChatPanel from "@/components/ChatPanel";
import ControlBar from "@/components/ControlBar";
import StatusIndicator from "@/components/StatusIndicator";
import ReferenceGallery from "@/components/ReferenceGallery";
import StyleSelector from "@/components/StyleSelector";
import ProductGallery from "@/components/ProductGallery";
import ShoppingList, { type ShoppingItem } from "@/components/ShoppingList";
import {
  GeminiLiveClient,
  type TranscriptEntry,
} from "@/lib/gemini-live";
import { AudioStreamer } from "@/lib/audio-streamer";

/** Max session duration in seconds (10 minutes) */
const MAX_SESSION_SEC = 10 * 60;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  // Chat/reference resize (percentage of right panel height given to chat)
  const [chatHeightPct, setChatHeightPct] = useState(60);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartPctRef = useRef(60);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "shopping">("chat");
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [roomPreview, setRoomPreview] = useState<{ imageBase64: string; mimeType: string; changes?: string[] } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [styleContext, setStyleContext] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageRef = useRef<{ base64: string; mimeType: string } | null>(null);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const pauseCameraFramesRef = useRef(false);
  const audioRef = useRef<AudioStreamer | null>(null);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session timer
  useEffect(() => {
    if (isConnected) {
      setSessionElapsed(0);
      timerRef.current = setInterval(() => {
        setSessionElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Auto-disconnect at limit
  useEffect(() => {
    if (sessionElapsed >= MAX_SESSION_SEC && isConnected) {
      clientRef.current?.disconnect();
      audioRef.current?.destroy();
      clientRef.current = null;
      audioRef.current = null;
      setIsConnected(false);
      setIsCameraOn(false);
      setIsMicOn(true);
      setIsSpeaking(false);
      setError("Session ended — 10 minute limit reached (budget protection)");
    }
  }, [sessionElapsed, isConnected]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleTranscriptStream = useCallback(
    (role: "user" | "agent", fullText: string) => {
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role && Date.now() - last.timestamp < 30000) {
          return [...prev.slice(0, -1), { ...last, text: fullText }];
        }
        return [...prev, { role, text: fullText, timestamp: Date.now() }];
      });
    },
    []
  );

  const handleTurnComplete = useCallback(() => {
    setTranscript((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), { ...last, timestamp: 0 }];
    });
  }, []);

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const handleInterrupted = useCallback(() => {
    // User interrupted — stop AI audio immediately
    audioRef.current?.stopPlayback();
    setIsSpeaking(false);
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
  }, []);

  const disconnectSession = useCallback(() => {
    clientRef.current?.disconnect();
    audioRef.current?.destroy();
    clientRef.current = null;
    audioRef.current = null;
    setIsConnected(false);
    setIsCameraOn(false);
    setIsMicOn(true);
    setIsSpeaking(false);
    pauseCameraFramesRef.current = false;
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
  }, []);

  const handleToggleSession = useCallback(async () => {
    if (isConnected) {
      disconnectSession();
      return;
    }

    setIsConnecting(true);
    setError(null);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Gemini API key not configured");
      setIsConnecting(false);
      return;
    }

    try {
      const audio = new AudioStreamer();
      audioRef.current = audio;

      const client = new GeminiLiveClient(apiKey, {
        onAudioOutput: (audioData) => {
          audio.playAudio(audioData);
          setIsSpeaking(true);
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 800);
        },
        onTranscript: addTranscript,
        onTranscriptStream: handleTranscriptStream,
        onTurnComplete: handleTurnComplete,
        onInterrupted: handleInterrupted,
        onConnectionChange: (connected) => {
          setIsConnected(connected);
          if (connected) {
            setIsCameraOn(true);
          }
        },
        onError: (err) => {
          setError(err);
          console.error("Gemini error:", err);
        },
        onToolResult: (toolName, result) => {
          if (toolName === "search_references" && result.images) {
            setReferenceImages(result.images);
          }
          if (toolName === "search_products" && result.products) {
            setProducts(result.products);
            setActiveTab("shopping");
          }
          if (toolName === "create_shopping_list" && result.items) {
            const newItems: ShoppingItem[] = result.items.map((item: any) => ({
              title: item.name,
              price: item.estimated_price,
              source: "Recommended",
              link: "",
            }));
            setShoppingList((prev) => [...prev, ...newItems]);
            setActiveTab("shopping");
          }
          if (toolName === "generate_room_preview" && result.generating) {
            setIsGeneratingPreview(true);
            setPreviewError(null);
            setRoomPreview(null);  // clear old preview so spinner shows
            setActiveTab("shopping");
            // Start countdown from 20s
            setPreviewCountdown(20);
            if (previewTimerRef.current) clearInterval(previewTimerRef.current);
            previewTimerRef.current = setInterval(() => {
              setPreviewCountdown((c) => {
                if (c <= 1) {
                  clearInterval(previewTimerRef.current!);
                  previewTimerRef.current = null;
                  return 0;
                }
                return c - 1;
              });
            }, 1000);
          }
          if (toolName === "generate_room_preview_done") {
            setIsGeneratingPreview(false);
            setPreviewCountdown(0);
            if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
            if (result.imageBase64) {
              setRoomPreview({ imageBase64: result.imageBase64, mimeType: result.mimeType ?? "image/png", changes: result.changes });
              if (result.style) setStyleContext(result.style);
              setActiveTab("shopping");
            } else {
              setPreviewError(result.error ?? "Preview generation failed");
              setActiveTab("shopping");
            }
          }
        },
        getUploadedImage: () => uploadedImageRef.current,
      });

      clientRef.current = client;
      await client.connect();

      await audio.startRecording((base64Audio) => {
        client.sendAudio(base64Audio);
      });
    } catch (err: any) {
      setError(err.message || "Failed to start session");
      clientRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, disconnectSession, addTranscript, handleTranscriptStream, handleTurnComplete, handleInterrupted]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mimeType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setUploadedImage({ base64, mimeType, previewUrl: dataUrl });
      uploadedImageRef.current = { base64, mimeType };
      setRoomPreview(null);
      setPreviewError(null);
      // Pause live camera frames so they don't override the uploaded image context
      pauseCameraFramesRef.current = true;
      // Send as a proper clientContent message with text instruction
      if (clientRef.current) {
        clientRef.current.sendImageMessage(base64, mimeType);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleRemoveUploadedImage = useCallback(() => {
    setUploadedImage(null);
    uploadedImageRef.current = null;
    setRoomPreview(null);
    setPreviewError(null);
    pauseCameraFramesRef.current = false;
  }, []);

  const handleGeneratePreview = useCallback(async () => {
    if (!uploadedImage) return;
    setIsGeneratingPreview(true);
    setPreviewError(null);
    setActiveTab("shopping");
    setPreviewCountdown(20);
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    previewTimerRef.current = setInterval(() => {
      setPreviewCountdown((c) => {
        if (c <= 1) { clearInterval(previewTimerRef.current!); previewTimerRef.current = null; return 0; }
        return c - 1;
      });
    }, 1000);
    try {
      const res = await fetch("/api/room/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.mimeType,
          styleContext: styleContext || undefined,
        }),
      });
      const data = await res.json();
      if (data.imageBase64) {
        setRoomPreview({ imageBase64: data.imageBase64, mimeType: data.mimeType ?? "image/png" });
        setActiveTab("shopping");
      } else if (data.description) {
        setPreviewError("Preview: " + data.description);
      } else {
        setPreviewError(data.error ?? "Failed to generate preview");
      }
    } catch {
      setPreviewError("Failed to generate room preview");
    } finally {
      setIsGeneratingPreview(false);
      setPreviewCountdown(0);
      if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    }
  }, [uploadedImage, styleContext]);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartPctRef.current = chatHeightPct;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !rightPanelRef.current) return;
      const panelH = rightPanelRef.current.getBoundingClientRect().height;
      const delta = ev.clientY - dragStartYRef.current;
      const deltaPct = (delta / panelH) * 100;
      setChatHeightPct(Math.min(80, Math.max(20, dragStartPctRef.current + deltaPct)));
    };
    const onUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [chatHeightPct]);

  const handleAddToList = useCallback((product: ShoppingItem) => {
    setShoppingList((prev) => [...prev, product]);
  }, []);

  const handleRemoveFromList = useCallback((index: number) => {
    setShoppingList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearList = useCallback(() => {
    setShoppingList([]);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const handleToggleMic = useCallback(() => {
    if (isMicOn) {
      audioRef.current?.stopRecording();
    } else {
      audioRef.current?.startRecording((base64Audio) => {
        clientRef.current?.sendAudio(base64Audio);
      });
    }
    setIsMicOn((prev) => !prev);
  }, [isMicOn]);

  const handleCameraFrame = useCallback((base64: string) => {
    if (!pauseCameraFramesRef.current) {
      clientRef.current?.sendImage(base64);
    }
  }, []);

  const timeRemaining = MAX_SESSION_SEC - sessionElapsed;
  const isLowTime = timeRemaining <= 60 && isConnected;

  return (
    <main className="h-dvh flex flex-col md:flex-row bg-zinc-950">
      {/* Left: Camera + Controls */}
      <div className="flex flex-col md:w-1/2 lg:w-3/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-semibold text-white">
              J&apos;s Room AI
            </h1>
            <p className="text-xs text-zinc-500">Live AI Interior Designer</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Session timer */}
            {isConnected && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${
                  isLowTime
                    ? "bg-red-950 text-red-400 ring-1 ring-red-800"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(sessionElapsed)} / {formatTime(MAX_SESSION_SEC)}
              </div>
            )}
            <StatusIndicator
              status={
                isConnecting
                  ? "connecting"
                  : isSpeaking
                    ? "speaking"
                    : isConnected
                      ? "listening"
                      : "offline"
              }
            />
          </div>
        </div>

        {/* Camera */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <CameraFeed
              isActive={isCameraOn}
              onFrame={handleCameraFrame}
              intervalSec={5}
            />
          </div>
        </div>

        {/* Image upload */}
        <div className="px-4 py-2 flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          {uploadedImage ? (
            <div className="flex flex-col gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <img
                  src={uploadedImage.previewUrl}
                  alt="Uploaded room"
                  className="w-12 h-10 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300">Room photo uploaded</p>
                  <p className="text-[10px] text-zinc-500">AI is analyzing this image</p>
                </div>
                <button
                  onClick={() => {
                    if (isConnected && clientRef.current && uploadedImage) {
                      clientRef.current.sendImageMessage(uploadedImage.base64, uploadedImage.mimeType);
                    }
                  }}
                  className="text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 rounded hover:bg-violet-900/30 transition-colors flex-shrink-0"
                  disabled={!isConnected}
                >
                  Re-analyze
                </button>
                <button
                  onClick={handleRemoveUploadedImage}
                  className="text-zinc-500 hover:text-zinc-300 text-sm flex-shrink-0 w-5 h-5 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Style (e.g. Scandinavian, Bohemian, Modern...)"
                  value={styleContext}
                  onChange={(e) => setStyleContext(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-600"
                />
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                  className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-medium rounded transition-colors whitespace-nowrap"
                >
                  {isGeneratingPreview ? "Generating..." : "Preview Room"}
                </button>
              </div>
              {previewError && (
                <p className="text-[10px] text-red-400">{previewError}</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-zinc-300 text-xs w-full"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Upload room photo for AI analysis + preview
            </button>
          )}
        </div>

        {/* Style presets */}
        <StyleSelector
          onStyleSelect={(text) => clientRef.current?.sendText(text)}
          disabled={!isConnected}
        />

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-950 border border-red-800 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Controls */}
        <ControlBar
          isConnected={isConnected}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          onToggleSession={handleToggleSession}
          onToggleCamera={handleToggleCamera}
          onToggleMic={handleToggleMic}
        />
      </div>

      {/* Right: Tabbed Panel */}
      <div ref={rightPanelRef} className="flex flex-col md:w-1/2 lg:w-2/5 border-t md:border-t-0 md:border-l border-zinc-800 h-[40vh] md:h-full">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "text-white border-b-2 border-violet-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === "shopping"
                ? "text-white border-b-2 border-violet-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Shopping
            {shoppingList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px]">
                {shoppingList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "chat" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Chat section */}
            <div style={{ height: `${chatHeightPct}%` }} className="overflow-hidden flex flex-col min-h-0">
              <ChatPanel transcript={transcript} />
            </div>

            {/* Drag handle — only visible when reference images exist */}
            {referenceImages.length > 0 && (
              <div
                onMouseDown={handleDividerMouseDown}
                className="flex-shrink-0 h-2 flex items-center justify-center cursor-row-resize group hover:bg-zinc-800/60 transition-colors border-y border-zinc-800 select-none"
                title="Drag to resize"
              >
                <div className="w-8 h-0.5 rounded-full bg-zinc-700 group-hover:bg-violet-500 transition-colors" />
              </div>
            )}

            {/* Reference images section */}
            {referenceImages.length > 0 && (
              <div style={{ height: `${100 - chatHeightPct}%` }} className="overflow-y-auto min-h-0">
                <ReferenceGallery images={referenceImages} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Error display */}
            {previewError && !isGeneratingPreview && (
              <div className="mx-3 mt-3 px-3 py-2 bg-red-950 border border-red-800 rounded-lg text-red-300 text-xs">
                {previewError}
                <button onClick={() => setPreviewError(null)} className="ml-2 text-red-500 hover:text-red-300">×</button>
              </div>
            )}

            {/* Preview generating */}
            {isGeneratingPreview && !roomPreview && (
              <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-xs text-zinc-300 font-medium">Generating your redesigned room...</span>
                  </div>
                  {previewCountdown > 0 && (
                    <span className="text-[10px] text-zinc-500 tabular-nums">~{previewCountdown}s remaining</span>
                  )}
                </div>
                <div className="aspect-video w-full bg-zinc-900 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-950/30 to-zinc-900" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-violet-700 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-xs text-zinc-500">Imagen 3 is redesigning your room</p>
                    <p className="text-[10px] text-zinc-700">Step 1: Analyzing room → Step 2: Generating image</p>
                  </div>
                </div>
              </div>
            )}

            {/* Room preview */}
            {roomPreview && (
              <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Room Preview
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-zinc-600">AI-generated redesign</span>
                    <button
                      onClick={() => setRoomPreview(null)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImage && (
                    <div>
                      <p className="text-[10px] text-zinc-600 mb-1">Before</p>
                      <img
                        src={uploadedImage.previewUrl}
                        alt="Original room"
                        className="w-full rounded-lg object-cover aspect-video"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-1">After{styleContext ? ` — ${styleContext}` : ""}</p>
                    <img
                      src={`data:${roomPreview.mimeType};base64,${roomPreview.imageBase64}`}
                      alt="Redesigned room"
                      className="w-full rounded-lg object-cover aspect-video"
                    />
                  </div>
                </div>
                {roomPreview.changes && roomPreview.changes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Changes applied</p>
                    <ul className="space-y-0.5">
                      {roomPreview.changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-400">
                          <span className="text-violet-500 mt-0.5">✓</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <ProductGallery products={products} onAddToList={handleAddToList} />
            <ShoppingList items={shoppingList} onRemove={handleRemoveFromList} onClear={handleClearList} />
          </div>
        )}
      </div>
    </main>
  );
}
