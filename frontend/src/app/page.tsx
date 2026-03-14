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
import ThemeToggle from "@/components/ThemeToggle";
import {
  GeminiLiveClient,
  type TranscriptEntry,
} from "@/lib/gemini-live";
import { AudioStreamer } from "@/lib/audio-streamer";

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

  const [products, setProducts] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "shopping">("chat");
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const [roomPreview, setRoomPreview] = useState<{
    imageBase64: string;
    mimeType: string;
    changes?: string[];
  } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [styleContext, setStyleContext] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const pauseCameraFramesRef = useRef(false);
  const audioRef = useRef<AudioStreamer | null>(null);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCameraFrameRef = useRef<{ base64: string; mimeType: string } | null>(null);

  // Keep transcript ref in sync for reconnect context
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Session timer
  useEffect(() => {
    if (isConnected) {
      setSessionElapsed(0);
      timerRef.current = setInterval(() => setSessionElapsed((p) => p + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    if (isConnected) { disconnectSession(); return; }

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
            setError(null);
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
            setRoomPreview(null);
            setActiveTab("shopping");
            setPreviewCountdown(20);
            if (previewTimerRef.current) clearInterval(previewTimerRef.current);
            previewTimerRef.current = setInterval(() => {
              setPreviewCountdown((c) => {
                if (c <= 1) { clearInterval(previewTimerRef.current!); previewTimerRef.current = null; return 0; }
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
        getUploadedImage: () => uploadedImageRef.current ?? latestCameraFrameRef.current,
        getTranscript: () => transcriptRef.current,
      });

      clientRef.current = client;
      await client.connect();
      await audio.startRecording((base64Audio) => { client.sendAudio(base64Audio); });
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
      pauseCameraFramesRef.current = true;
      if (clientRef.current) clientRef.current.sendImageMessage(base64, mimeType);
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
        body: JSON.stringify({ imageBase64: uploadedImage.base64, mimeType: uploadedImage.mimeType, styleContext: styleContext || undefined }),
      });
      const data = await res.json();
      if (data.imageBase64) {
        setRoomPreview({ imageBase64: data.imageBase64, mimeType: data.mimeType ?? "image/png" });
        setActiveTab("shopping");
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

  const handleAddToList = useCallback((product: ShoppingItem) => {
    setShoppingList((prev) => [...prev, product]);
  }, []);

  const handleRemoveFromList = useCallback((index: number) => {
    setShoppingList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearList = useCallback(() => setShoppingList([]), []);
  const handleToggleCamera = useCallback(() => setIsCameraOn((p) => !p), []);

  const handleToggleMic = useCallback(() => {
    if (isMicOn) {
      audioRef.current?.stopRecording();
    } else {
      audioRef.current?.startRecording((base64Audio) => {
        clientRef.current?.sendAudio(base64Audio);
      });
    }
    setIsMicOn((p) => !p);
  }, [isMicOn]);

  const handleCameraFrame = useCallback((base64: string) => {
    latestCameraFrameRef.current = { base64, mimeType: "image/jpeg" };
    if (!pauseCameraFramesRef.current) clientRef.current?.sendImage(base64);
  }, []);

  const timeRemaining = MAX_SESSION_SEC - sessionElapsed;
  const isLowTime = timeRemaining <= 60 && isConnected;

  const statusValue = isConnecting
    ? "connecting"
    : isSpeaking
    ? "speaking"
    : isConnected
    ? "listening"
    : "offline";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top Navigation ── */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-white/5 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-white !text-2xl">auto_awesome</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Live Room AI</h1>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-primary text-sm font-semibold">Live Studio</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium">History</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium">Assets</a>
          </nav>
        </div>

        {/* Right side: search, status, timer, theme toggle, avatar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">search</span>
            <input
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-full pl-10 pr-4 py-2 text-sm w-56 focus:ring-2 focus:ring-primary outline-none placeholder-slate-400"
              placeholder="Search redesigns..."
            />
          </div>

          {/* Status indicator */}
          <StatusIndicator status={statusValue} />

          {/* Session timer */}
          {isConnected && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${
              isLowTime
                ? "bg-red-950 text-red-400 ring-1 ring-red-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              <span className="material-symbols-outlined !text-xs">timer</span>
              {formatTime(sessionElapsed)} / {formatTime(MAX_SESSION_SEC)}
            </div>
          )}

          <ThemeToggle />

          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary !text-xl">person</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* ── Left Panel: Camera + Previews ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">

          {/* Live Camera Viewport */}
          <div className="relative">
            <CameraFeed
              isActive={isCameraOn}
              onFrame={handleCameraFrame}
              isSpeaking={isSpeaking}
              intervalSec={5}
            />

            {/* Control bar overlaid at bottom of camera */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 pb-5">
              <ControlBar
                isConnected={isConnected}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                isConnecting={isConnecting}
                onToggleSession={handleToggleSession}
                onToggleCamera={handleToggleCamera}
                onToggleMic={handleToggleMic}
              />
              {/* Upload button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl text-sm font-semibold transition-all"
              >
                <span className="material-symbols-outlined !text-lg">upload_file</span>
                <span className="hidden sm:inline">Upload Room</span>
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <span className="material-symbols-outlined !text-lg shrink-0 mt-0.5">error</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined !text-lg">close</span>
              </button>
            </div>
          )}

          {/* Uploaded image strip */}
          {uploadedImage && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={uploadedImage.previewUrl}
                  alt="Uploaded room"
                  className="w-14 h-12 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Room photo uploaded</p>
                  <p className="text-xs text-slate-500 mt-0.5">AI is analyzing this image</p>
                </div>
                <button
                  onClick={() => {
                    if (isConnected && clientRef.current && uploadedImage) {
                      clientRef.current.sendImageMessage(uploadedImage.base64, uploadedImage.mimeType);
                    }
                  }}
                  disabled={!isConnected}
                  className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors font-medium disabled:opacity-40"
                >
                  Re-analyze
                </button>
                <button onClick={handleRemoveUploadedImage} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined !text-lg">close</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Style preference (e.g. Scandinavian, Bohemian...)"
                  value={styleContext}
                  onChange={(e) => setStyleContext(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                  className="px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined !text-base">
                    {isGeneratingPreview ? "progress_activity" : "auto_awesome"}
                  </span>
                  {isGeneratingPreview ? `Generating... ${previewCountdown > 0 ? `~${previewCountdown}s` : ""}` : "Preview Room"}
                </button>
              </div>
              {previewError && <p className="text-xs text-red-400 mt-2">{previewError}</p>}
            </div>
          )}

          {/* Real-time Redesign section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Real-time Redesign
              </h3>
              <StyleSelector
                onStyleSelect={(text) => clientRef.current?.sendText(text)}
                disabled={!isConnected}
              />
            </div>

            {/* Before / After Grid */}
            {(uploadedImage || roomPreview || isGeneratingPreview) && (
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage.previewUrl}
                        alt="Original room"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 !text-3xl">image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                      Original
                    </div>
                  </div>
                  <div className="px-1">
                    <h4 className="text-sm font-semibold">Current Setup</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your room as-is</p>
                  </div>
                </div>

                {/* After */}
                <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                    {isGeneratingPreview && !roomPreview ? (
                      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-primary !text-3xl animate-spin">progress_activity</span>
                        <p className="text-xs text-slate-500">Imagen 3 is redesigning...</p>
                        {previewCountdown > 0 && (
                          <span className="text-[10px] text-slate-400 tabular-nums">~{previewCountdown}s remaining</span>
                        )}
                      </div>
                    ) : roomPreview ? (
                      <>
                        <img
                          src={`data:${roomPreview.mimeType};base64,${roomPreview.imageBase64}`}
                          alt="Redesigned room"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <span className="material-symbols-outlined text-white !text-base bg-primary p-1 rounded-full">check_circle</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 !text-3xl">auto_awesome</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                      AI Redesign
                    </div>
                  </div>
                  <div className="px-1">
                    <h4 className="text-sm font-semibold">
                      {styleContext ? `${styleContext} Style` : "AI Reimagined"}
                    </h4>
                    {roomPreview?.changes && roomPreview.changes.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {roomPreview.changes.slice(0, 2).map((c, i) => (
                          <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1">
                            <span className="text-primary mt-0.5">✓</span>{c}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {roomPreview ? "AI-generated redesign" : "Upload a room photo to preview"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="w-96 border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-xl shrink-0">

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === "chat"
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined !text-lg">chat</span>
              Conversation
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 relative transition-colors ${
                activeTab === "shopping"
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined !text-lg">shopping_cart</span>
              Shopping
              {shoppingList.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "chat" ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable chat */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <ChatPanel transcript={transcript} />
              </div>

              {/* Reference gallery */}
              {referenceImages.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto">
                  <ReferenceGallery images={referenceImages} />
                </div>
              )}

              {/* Input area — pinned bottom */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/5 shrink-0">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-slate-400 !text-xl">mic</span>
                  <span className="flex-1 text-sm text-slate-400 italic py-2">
                    {isConnected ? "Speak to the AI designer..." : "Start a session to begin"}
                  </span>
                  <button
                    onClick={handleToggleSession}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                      isConnected
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-primary text-white hover:brightness-110"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-lg">
                      {isConnected ? "stop" : "send"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Shopping tab */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Generating preview */}
              {isGeneratingPreview && !roomPreview && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Generating your redesigned room...</span>
                    {previewCountdown > 0 && (
                      <span className="text-[10px] text-slate-400 ml-auto tabular-nums">~{previewCountdown}s</span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview error */}
              {previewError && !isGeneratingPreview && (
                <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs shrink-0">
                  <span className="flex-1">{previewError}</span>
                  <button onClick={() => setPreviewError(null)}>
                    <span className="material-symbols-outlined !text-base">close</span>
                  </button>
                </div>
              )}

              {/* Products */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {products.length > 0 && (
                  <ProductGallery products={products} onAddToList={handleAddToList} />
                )}
                <ShoppingList
                  items={shoppingList}
                  onRemove={handleRemoveFromList}
                  onClear={handleClearList}
                />
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
