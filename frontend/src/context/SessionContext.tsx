"use client";

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import {
  GeminiLiveClient,
  type TranscriptEntry,
  type GeminiLiveCallbacks,
} from "@/lib/gemini-live";
import { AudioStreamer } from "@/lib/audio-streamer";
import { createProjectFromSession, saveProject, saveProjectImages, loadProject as loadStoredProject, loadProjectImages, type Project } from "@/lib/storage";

/* ── Types ── */

export type DesignChoice = {
  key: string;
  label: string;
  value: string | null;
  confirmed: boolean;
};

export type UploadedImage = {
  base64: string;
  mimeType: string;
  previewUrl: string;
};

export type RoomPreview = {
  imageBase64: string;
  mimeType: string;
  changes?: string[];
  style?: string;
};

export type SavedItem = {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail?: string;
};

export type Product = {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail: string;
  rating?: number;
};

export type ReferenceImage = {
  id?: string;
  url_small: string;
  url_regular: string;
  alt: string;
  photographer: string;
  photographer_url?: string;
};

export type SessionPhase = "landing" | "active";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export type SessionState = {
  /* Phase */
  sessionPhase: SessionPhase;

  /* Connection */
  connectionStatus: "disconnected" | "connecting" | "connected";
  voiceState: VoiceState;
  sessionElapsed: number;

  /* Media */
  isMicOn: boolean;
  isCameraOn: boolean;
  uploadedImage: UploadedImage | null;
  isImageAnalyzing: boolean;
  imageAnalyzingStartedAt: number;

  /* Conversation */
  transcript: TranscriptEntry[];
  chatInput: string;
  isAiTyping: boolean;

  /* Design */
  designChoices: DesignChoice[];
  referenceImages: ReferenceImage[];

  /* Preview */
  previewStatus: "idle" | "generating" | "done" | "error";
  currentPreview: RoomPreview | null;
  previewError: string | null;

  /* Shopping */
  searchResults: Product[];
  savedItems: SavedItem[];

  /* UI */
  activeTab: "chat" | "shopping";
  styleContext: string;
  error: string | null;
};

/* ── Initial State ── */

const DEFAULT_DESIGN_CHOICES: DesignChoice[] = [
  { key: "style", label: "Style", value: null, confirmed: false },
  { key: "walls", label: "Wall Color", value: null, confirmed: false },
  { key: "ceiling", label: "Ceiling", value: null, confirmed: false },
  { key: "floor", label: "Flooring", value: null, confirmed: false },
  { key: "furniture", label: "Furniture", value: null, confirmed: false },
  { key: "keep", label: "Keep List", value: null, confirmed: false },
  { key: "lighting", label: "Lighting", value: null, confirmed: false },
  { key: "budget", label: "Budget", value: null, confirmed: false },
];

export const initialState: SessionState = {
  sessionPhase: "landing",
  connectionStatus: "disconnected",
  voiceState: "idle",
  sessionElapsed: 0,
  isMicOn: false,
  isCameraOn: false,
  uploadedImage: null,
  isImageAnalyzing: false,
  imageAnalyzingStartedAt: 0,
  transcript: [],
  chatInput: "",
  isAiTyping: false,
  designChoices: DEFAULT_DESIGN_CHOICES,
  referenceImages: [],
  previewStatus: "idle",
  currentPreview: null,
  previewError: null,
  searchResults: [],
  savedItems: [],
  activeTab: "chat",
  styleContext: "",
  error: null,
};

/* ── Actions ── */

export type SessionAction =
  | { type: "SET_PHASE"; phase: SessionPhase }
  | { type: "SET_CONNECTING" }
  | { type: "SET_CONNECTED" }
  | { type: "SET_DISCONNECTED" }
  | { type: "DISCONNECT" }
  | { type: "SET_MIC"; on: boolean }
  | { type: "SET_CAMERA"; on: boolean }
  | { type: "SET_SPEAKING"; speaking: boolean }
  | { type: "TICK_TIMER" }
  | { type: "RESET_TIMER" }
  | { type: "ADD_TRANSCRIPT"; entry: TranscriptEntry }
  | { type: "STREAM_TRANSCRIPT"; role: "user" | "agent"; text: string }
  | { type: "TURN_COMPLETE" }
  | { type: "SET_CHAT_INPUT"; value: string }
  | { type: "SET_AI_TYPING"; typing: boolean }
  | { type: "SET_UPLOADED_IMAGE"; image: UploadedImage | null }
  | { type: "SET_ROOM_PREVIEW"; preview: RoomPreview | null }
  | { type: "SET_PREVIEW_STATUS"; status: SessionState["previewStatus"] }
  | { type: "SET_PREVIEW_ERROR"; error: string | null }
  | { type: "SET_REFERENCE_IMAGES"; images: ReferenceImage[] }
  | { type: "SET_SEARCH_RESULTS"; products: Product[] }
  | { type: "ADD_SAVED_ITEM"; item: SavedItem }
  | { type: "REMOVE_SAVED_ITEM"; index: number }
  | { type: "REMOVE_SAVED_ITEM_BY_TITLE"; title: string }
  | { type: "CLEAR_SAVED_ITEMS" }
  | { type: "SET_ACTIVE_TAB"; tab: "chat" | "shopping" }
  | { type: "SET_STYLE_CONTEXT"; value: string }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "UPDATE_DESIGN_CHOICE"; key: string; value: string }
  | { type: "SET_DESIGN_CHOICES_FROM_TOOL"; args: Record<string, any> }
  | { type: "RESET" }
  | { type: "CLEAR_ANALYZING" }
  | { type: "LOAD_PROJECT"; project: import("@/lib/storage").Project; roomPreviewUrl: string | null; previewData: RoomPreview | null };

/* ── Reducer ── */

/** Only allow clearing isImageAnalyzing if at least 2s have passed since it was set.
 *  This prevents pre-existing audio/transcript activity from instantly clearing it. */
const MIN_ANALYZING_MS = 2000;
function canClearAnalyzing(state: SessionState): boolean {
  return state.isImageAnalyzing && (Date.now() - state.imageAnalyzingStartedAt >= MIN_ANALYZING_MS);
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, sessionPhase: action.phase };

    case "SET_CONNECTING":
      return { ...state, connectionStatus: "connecting", error: null };

    case "SET_CONNECTED":
      return { ...state, connectionStatus: "connected" };

    case "SET_DISCONNECTED":
      return { ...state, connectionStatus: "disconnected", voiceState: "idle" };

    case "DISCONNECT":
      return {
        ...state,
        connectionStatus: "disconnected",
        isCameraOn: false,
        isMicOn: false,
        voiceState: "idle",
        isAiTyping: false,
      };

    case "SET_MIC":
      return { ...state, isMicOn: action.on };

    case "SET_CAMERA":
      return { ...state, isCameraOn: action.on };

    case "SET_SPEAKING":
      return {
        ...state,
        voiceState: action.speaking ? "speaking" : (state.connectionStatus === "connected" ? "listening" : "idle"),
        // Clear analyzing overlay when AI starts speaking (audio response) — but only after min delay
        ...(action.speaking && canClearAnalyzing(state) && { isImageAnalyzing: false, imageAnalyzingStartedAt: 0 }),
      };

    case "TICK_TIMER":
      return { ...state, sessionElapsed: state.sessionElapsed + 1 };

    case "RESET_TIMER":
      return { ...state, sessionElapsed: 0 };

    case "ADD_TRANSCRIPT":
      return {
        ...state,
        transcript: [...state.transcript, action.entry],
        isAiTyping: false,
        ...(canClearAnalyzing(state) && { isImageAnalyzing: false, imageAnalyzingStartedAt: 0 }),
      };

    case "STREAM_TRANSCRIPT": {
      const prev = state.transcript;
      const last = prev[prev.length - 1];
      // Clear analyzing state when agent starts responding — but only after min delay
      const clearAnalyzing = action.role === "agent" && canClearAnalyzing(state);
      if (last && last.role === action.role && Date.now() - last.timestamp < 30000) {
        return {
          ...state,
          transcript: [...prev.slice(0, -1), { ...last, text: action.text }],
          isAiTyping: false,
          ...(clearAnalyzing && { isImageAnalyzing: false, imageAnalyzingStartedAt: 0 }),
        };
      }
      return {
        ...state,
        transcript: [...prev, { role: action.role, text: action.text, timestamp: Date.now() }],
        isAiTyping: false,
        ...(clearAnalyzing && { isImageAnalyzing: false, imageAnalyzingStartedAt: 0 }),
      };
    }

    case "TURN_COMPLETE": {
      if (state.transcript.length === 0) return state;
      const last = state.transcript[state.transcript.length - 1];
      return {
        ...state,
        transcript: [...state.transcript.slice(0, -1), { ...last, timestamp: 0 }],
        isAiTyping: false,
      };
    }

    case "SET_CHAT_INPUT":
      return { ...state, chatInput: action.value };

    case "SET_AI_TYPING":
      return { ...state, isAiTyping: action.typing };

    case "SET_UPLOADED_IMAGE":
      return {
        ...state,
        uploadedImage: action.image,
        isImageAnalyzing: !!action.image,
        imageAnalyzingStartedAt: action.image ? Date.now() : 0,
        currentPreview: action.image ? state.currentPreview : null,
        previewError: action.image ? state.previewError : null,
      };

    case "SET_ROOM_PREVIEW":
      return { ...state, currentPreview: action.preview, previewStatus: action.preview ? "done" : "idle" };

    case "SET_PREVIEW_STATUS":
      return { ...state, previewStatus: action.status };

    case "SET_PREVIEW_ERROR":
      return { ...state, previewError: action.error, previewStatus: action.error ? "error" : state.previewStatus };

    case "SET_REFERENCE_IMAGES":
      return { ...state, referenceImages: action.images };

    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.products, activeTab: "shopping" };

    case "ADD_SAVED_ITEM":
      return { ...state, savedItems: [...state.savedItems, action.item] };

    case "REMOVE_SAVED_ITEM":
      return { ...state, savedItems: state.savedItems.filter((_, i) => i !== action.index) };

    case "REMOVE_SAVED_ITEM_BY_TITLE":
      return { ...state, savedItems: state.savedItems.filter((item) => item.title !== action.title) };

    case "CLEAR_SAVED_ITEMS":
      return { ...state, savedItems: [] };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_STYLE_CONTEXT":
      return { ...state, styleContext: action.value };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "UPDATE_DESIGN_CHOICE": {
      const choices = state.designChoices.map((c) =>
        c.key === action.key ? { ...c, value: action.value, confirmed: true } : c
      );
      return { ...state, designChoices: choices };
    }

    case "SET_DESIGN_CHOICES_FROM_TOOL": {
      const args = action.args;
      // Try to extract budget from recent transcript
      let budgetValue: string | null = null;
      for (let i = state.transcript.length - 1; i >= Math.max(0, state.transcript.length - 10); i--) {
        const text = state.transcript[i].text.toLowerCase();
        const budgetMatch = text.match(/(\d[\d,]*\s*[-–to]*\s*\d*[\d,]*\s*k?\s*(?:inr|rupees?|₹|rs\.?))/i)
          || text.match(/(₹\s*[\d,]+(?:\s*[-–to]+\s*[\d,]+)?)/i)
          || text.match(/budget[:\s]+[^.]*?([\d,]+\s*[-–to]*\s*[\d,]*\s*k?\s*(?:inr|₹)?)/i);
        if (budgetMatch) {
          budgetValue = budgetMatch[1] || budgetMatch[0];
          break;
        }
      }

      const choices = state.designChoices.map((c) => {
        let value: string | null = null;
        switch (c.key) {
          case "style": value = args.style || null; break;
          case "walls": value = args.wall_color || args.color_palette || null; break;
          case "ceiling": value = args.ceiling || null; break;
          case "floor": value = args.floor || null; break;
          case "furniture": value = args.changes?.join(", ") || null; break;
          case "keep": value = args.keep?.join(", ") || null; break;
          case "lighting": value = args.lighting || null; break;
          case "budget": value = budgetValue; break;
        }
        return value ? { ...c, value, confirmed: true } : c;
      });
      return { ...state, designChoices: choices };
    }

    case "RESET":
      return { ...initialState };

    case "CLEAR_ANALYZING":
      return { ...state, isImageAnalyzing: false };

    case "LOAD_PROJECT": {
      const p = action.project;
      return {
        ...initialState,
        sessionPhase: "active" as SessionPhase,
        transcript: p.transcript,
        designChoices: p.designChoices.length > 0 ? p.designChoices : DEFAULT_DESIGN_CHOICES,
        savedItems: p.savedItems,
        referenceImages: p.referenceImages,
        uploadedImage: action.roomPreviewUrl
          ? { base64: "", mimeType: "", previewUrl: action.roomPreviewUrl }
          : null,
        currentPreview: action.previewData,
        previewStatus: action.previewData ? "done" : "idle",
        styleContext: p.designChoices.find((c) => c.key === "style")?.value || "",
      };
    }

    default:
      return state;
  }
}

/* ── Context ── */

type SessionContextValue = {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  refs: SessionRefs;
  actions: SessionActions;
};

export type SessionRefs = {
  clientRef: React.MutableRefObject<GeminiLiveClient | null>;
  audioRef: React.MutableRefObject<AudioStreamer | null>;
  speakingTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedImageRef: React.MutableRefObject<{ base64: string; mimeType: string } | null>;
  transcriptRef: React.MutableRefObject<TranscriptEntry[]>;
  pauseCameraFramesRef: React.MutableRefObject<boolean>;
  latestCameraFrameRef: React.MutableRefObject<{ base64: string; mimeType: string } | null>;
  previewTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
};

export type SessionActions = {
  toggleSession: (quietMode?: boolean) => Promise<void>;
  disconnectSession: () => void;
  sendChat: () => void;
  sendMessage: (text: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  handleCameraFrame: (base64: string) => void;
  handleCameraCapture: (base64: string, mimeType: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageFile: (file: File) => void;
  removeUploadedImage: () => void;
  generatePreview: () => Promise<void>;
  addSavedItem: (product: SavedItem) => void;
  removeSavedItem: (index: number) => void;
  unsaveSavedItem: (title: string) => void;
  clearSavedItems: () => void;
  editDesignChoice: (key: string) => void;
  resetSession: () => void;
  loadProjectSession: (projectId: string) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/* ── Provider ── */

const MAX_SESSION_SEC = 10 * 60;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  /* Refs */
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const audioRef = useRef<AudioStreamer | null>(null);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedImageRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const pauseCameraFramesRef = useRef(false);
  const latestCameraFrameRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Safety timeout: auto-clear isImageAnalyzing after 30s (fallback)
  const analyzingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (state.isImageAnalyzing) {
      analyzingTimeoutRef.current = setTimeout(() => {
        console.warn("isImageAnalyzing timeout — auto-clearing after 30s");
        dispatch({ type: "CLEAR_ANALYZING" });
      }, 30000);
    } else {
      if (analyzingTimeoutRef.current) {
        clearTimeout(analyzingTimeoutRef.current);
        analyzingTimeoutRef.current = null;
      }
    }
    return () => {
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
    };
  }, [state.isImageAnalyzing]);

  // Keep refs in sync
  useEffect(() => {
    transcriptRef.current = state.transcript;
  }, [state.transcript]);

  useEffect(() => {
    if (state.uploadedImage) {
      uploadedImageRef.current = { base64: state.uploadedImage.base64, mimeType: state.uploadedImage.mimeType };
    } else {
      uploadedImageRef.current = null;
    }
  }, [state.uploadedImage]);

  // Session timer
  useEffect(() => {
    if (state.connectionStatus === "connected") {
      dispatch({ type: "RESET_TIMER" });
      timerRef.current = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.connectionStatus]);

  // Auto-disconnect at limit
  useEffect(() => {
    if (state.sessionElapsed >= MAX_SESSION_SEC && state.connectionStatus === "connected") {
      disconnectSession();
      dispatch({ type: "SET_ERROR", error: "Session ended — 10 minute limit reached (budget protection)" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionElapsed, state.connectionStatus]);

  /* ── Pending queues for send-after-connect ── */
  const pendingMessageRef = useRef<string | null>(null);
  const pendingImageRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const saveCurrentProjectRef = useRef<() => Promise<void>>(() => Promise.resolve());

  /* ── Actions ── */

  /** Save current session to storage (creates or updates project) */
  const saveCurrentProject = useCallback(async () => {
    const t = transcriptRef.current;
    if (t.length < 2 && !uploadedImageRef.current) return;

    try {
      let project: Project;
      if (currentProjectIdRef.current) {
        // Update existing project
        const existing = loadStoredProject(currentProjectIdRef.current);
        if (existing) {
          project = {
            ...existing,
            updatedAt: Date.now(),
            transcript: t,
            designChoices: state.designChoices,
            savedItems: state.savedItems,
            referenceImages: state.referenceImages,
          };
        } else {
          project = createProjectFromSession({ transcript: t, designChoices: state.designChoices, savedItems: state.savedItems, referenceImages: state.referenceImages, styleContext: state.styleContext });
          currentProjectIdRef.current = project.id;
        }
      } else {
        project = createProjectFromSession({ transcript: t, designChoices: state.designChoices, savedItems: state.savedItems, referenceImages: state.referenceImages, styleContext: state.styleContext });
        currentProjectIdRef.current = project.id;
      }

      await saveProject(project);

      // Save images to IndexedDB
      const roomPhoto = uploadedImageRef.current;
      const previews: { imageBase64: string; mimeType: string; changes?: string[]; style?: string }[] = [];
      if (state.currentPreview) previews.push(state.currentPreview);
      await saveProjectImages(project.id, roomPhoto, previews);
    } catch (e) {
      console.warn("Failed to auto-save project:", e);
    }
  }, [state.designChoices, state.currentPreview, state.savedItems, state.referenceImages, state.styleContext]);

  saveCurrentProjectRef.current = saveCurrentProject;

  const disconnectSession = useCallback(() => {
    // Auto-save project on disconnect
    saveCurrentProject();

    clientRef.current?.disconnect();
    audioRef.current?.destroy();
    clientRef.current = null;
    audioRef.current = null;
    pauseCameraFramesRef.current = false;
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    dispatch({ type: "DISCONNECT" });
  }, [saveCurrentProject]);

  const toggleSession = useCallback(async (quietMode = false) => {
    if (state.connectionStatus === "connected") {
      disconnectSession();
      return;
    }

    dispatch({ type: "SET_CONNECTING" });

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      dispatch({ type: "SET_ERROR", error: "Gemini API key not configured" });
      dispatch({ type: "SET_DISCONNECTED" });
      return;
    }

    try {
      const audio = new AudioStreamer();
      audioRef.current = audio;

      const client = new GeminiLiveClient(apiKey, {
        onAudioOutput: (audioData) => {
          audio.playAudio(audioData);
          dispatch({ type: "SET_SPEAKING", speaking: true });
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = setTimeout(() => {
            dispatch({ type: "SET_SPEAKING", speaking: false });
          }, 800);
        },
        onTranscript: (entry) => {
          dispatch({ type: "ADD_TRANSCRIPT", entry });
        },
        onTranscriptStream: (role, text) => {
          dispatch({ type: "STREAM_TRANSCRIPT", role, text });
        },
        onTurnComplete: () => {
          dispatch({ type: "TURN_COMPLETE" });
        },
        onInterrupted: () => {
          audioRef.current?.stopPlayback();
          dispatch({ type: "SET_SPEAKING", speaking: false });
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        },
        onConnectionChange: (connected) => {
          if (connected) {
            dispatch({ type: "SET_CONNECTED" });
            if (!quietMode) {
              dispatch({ type: "SET_CAMERA", on: true });
              dispatch({ type: "SET_ERROR", error: null });
            }
            // Send any pending message
            if (pendingMessageRef.current) {
              const msg = pendingMessageRef.current;
              pendingMessageRef.current = null;
              clientRef.current?.sendText(msg);
            }
            // Note: pending image is sent after connect() resolves (session not ready here yet)
          } else {
            dispatch({ type: "SET_DISCONNECTED" });
          }
        },
        onError: (err) => {
          dispatch({ type: "SET_ERROR", error: err });
          console.error("Gemini error:", err);
        },
        onToolResult: (toolName, result) => {
          if (toolName === "search_references" && result.images) {
            dispatch({ type: "SET_REFERENCE_IMAGES", images: result.images });
          }
          if (toolName === "search_products" && result.products) {
            dispatch({ type: "SET_SEARCH_RESULTS", products: result.products });
          }
          if (toolName === "create_shopping_list" && result.items) {
            const newItems: SavedItem[] = result.items.map((item: any) => ({
              title: item.name,
              price: item.estimated_price,
              source: "Recommended",
              link: "",
            }));
            for (const item of newItems) {
              dispatch({ type: "ADD_SAVED_ITEM", item });
            }
            dispatch({ type: "SET_ACTIVE_TAB", tab: "shopping" });
          }
          if (toolName === "generate_room_preview" && result.generating) {
            dispatch({ type: "SET_PREVIEW_STATUS", status: "generating" });
            dispatch({ type: "SET_PREVIEW_ERROR", error: null });
            dispatch({ type: "SET_ROOM_PREVIEW", preview: null });
            if (result.args) {
              dispatch({ type: "SET_DESIGN_CHOICES_FROM_TOOL", args: result.args });
            }
          }
          if (toolName === "generate_room_preview_done") {
            if (result.imageBase64) {
              const preview = {
                imageBase64: result.imageBase64,
                mimeType: result.mimeType ?? "image/png",
                changes: result.changes,
                style: result.style,
              };
              dispatch({ type: "SET_ROOM_PREVIEW", preview });
              if (result.style) dispatch({ type: "SET_STYLE_CONTEXT", value: result.style });
              // Auto-save project when preview is generated
              setTimeout(() => saveCurrentProjectRef.current(), 500);
              // Auto-trigger product search after preview
              setTimeout(() => {
                clientRef.current?.sendText(
                  "The preview looks great! Now search for ALL the products needed to achieve this design — furniture, decor, lighting, textiles, rugs. Search for each category separately so we get comprehensive results."
                );
              }, 1500);
            } else {
              dispatch({ type: "SET_PREVIEW_ERROR", error: result.error ?? "Preview generation failed" });
            }
          }
        },
        getUploadedImage: () => uploadedImageRef.current ?? latestCameraFrameRef.current,
        getTranscript: () => transcriptRef.current,
      });

      clientRef.current = client;
      // Skip welcome greeting if an image is queued — the image analysis will be the first turn
      if (pendingImageRef.current) {
        console.log("toggleSession: pending image detected, setting skipWelcome");
        client.skipWelcome = true;
      }
      await client.connect();
      console.log("toggleSession: connect() resolved, session ready");

      // Send any pending image now that session is fully ready
      if (pendingImageRef.current) {
        const img = pendingImageRef.current;
        pendingImageRef.current = null;
        console.log("toggleSession: sending pending image, base64 length:", img.base64.length);
        client.sendImageMessage(img.base64, img.mimeType);
      }

      if (!quietMode) {
        dispatch({ type: "SET_MIC", on: true });
        await audio.startRecording((base64Audio) => {
          client.sendAudio(base64Audio);
        });
      } else {
        dispatch({ type: "SET_MIC", on: false });
      }
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", error: err.message || "Failed to start session" });
      clientRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      dispatch({ type: "SET_DISCONNECTED" });
    }
  }, [state.connectionStatus, disconnectSession]);

  const sendChat = useCallback(() => {
    const text = state.chatInput.trim();
    if (!text) return;

    dispatch({ type: "SET_CHAT_INPUT", value: "" });
    dispatch({ type: "ADD_TRANSCRIPT", entry: { role: "user", text, timestamp: Date.now() } });
    dispatch({ type: "SET_AI_TYPING", typing: true });

    if (state.connectionStatus !== "connected") {
      // Queue message and start quiet session
      pendingMessageRef.current = text;
      toggleSession(true);
    } else {
      clientRef.current?.sendText(text);
    }
  }, [state.chatInput, state.connectionStatus, toggleSession]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    dispatch({ type: "ADD_TRANSCRIPT", entry: { role: "user", text, timestamp: Date.now() } });
    dispatch({ type: "SET_AI_TYPING", typing: true });
    if (state.connectionStatus === "connected") {
      clientRef.current?.sendText(text);
    }
  }, [state.connectionStatus]);

  const toggleMic = useCallback(() => {
    if (state.isMicOn) {
      audioRef.current?.stopRecording();
      dispatch({ type: "SET_MIC", on: false });
    } else {
      audioRef.current?.startRecording((base64Audio) => {
        clientRef.current?.sendAudio(base64Audio);
      });
      dispatch({ type: "SET_MIC", on: true });
    }
  }, [state.isMicOn]);

  const toggleCamera = useCallback(() => {
    dispatch({ type: "SET_CAMERA", on: !state.isCameraOn });
  }, [state.isCameraOn]);

  const handleCameraFrame = useCallback((base64: string) => {
    latestCameraFrameRef.current = { base64, mimeType: "image/jpeg" };
    if (!pauseCameraFramesRef.current) clientRef.current?.sendImage(base64);
  }, []);

  const sendOrQueueImage = useCallback((base64: string, mimeType: string) => {
    console.log("sendOrQueueImage called — clientRef exists:", !!clientRef.current, "base64 length:", base64?.length);
    if (clientRef.current) {
      console.log("sendOrQueueImage: sending directly via existing client");
      clientRef.current.sendImageMessage(base64, mimeType);
    } else {
      // Queue the image and start a quiet session
      console.log("sendOrQueueImage: queuing image and starting quiet session");
      pendingImageRef.current = { base64, mimeType };
      toggleSession(true);
    }
  }, [toggleSession]);

  const handleCameraCapture = useCallback((base64: string, mimeType: string) => {
    const previewUrl = `data:${mimeType};base64,${base64}`;
    dispatch({ type: "SET_UPLOADED_IMAGE", image: { base64, mimeType, previewUrl } });
    pauseCameraFramesRef.current = true;
    dispatch({ type: "SET_PHASE", phase: "active" });
    dispatch({ type: "SET_CAMERA", on: false });
    sendOrQueueImage(base64, mimeType);
  }, [sendOrQueueImage]);

  const handleImageFile = useCallback((file: File) => {
    const mimeType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      dispatch({ type: "SET_UPLOADED_IMAGE", image: { base64, mimeType, previewUrl: dataUrl } });
      pauseCameraFramesRef.current = true;
      dispatch({ type: "SET_PHASE", phase: "active" });
      sendOrQueueImage(base64, mimeType);
    };
    reader.readAsDataURL(file);
  }, [sendOrQueueImage]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageFile(file);
    e.target.value = "";
  }, [handleImageFile]);

  const removeUploadedImage = useCallback(() => {
    dispatch({ type: "SET_UPLOADED_IMAGE", image: null });
    dispatch({ type: "SET_ROOM_PREVIEW", preview: null });
    dispatch({ type: "SET_PREVIEW_ERROR", error: null });
    pauseCameraFramesRef.current = false;
  }, []);

  const generatePreview = useCallback(async () => {
    if (!state.uploadedImage) return;
    dispatch({ type: "SET_PREVIEW_STATUS", status: "generating" });
    dispatch({ type: "SET_PREVIEW_ERROR", error: null });
    try {
      const res = await fetch("/api/room/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: state.uploadedImage.base64,
          mimeType: state.uploadedImage.mimeType,
          styleContext: state.styleContext || undefined,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        let errMsg = `Preview failed (${res.status})`;
        try { errMsg = JSON.parse(errText).error || errMsg; } catch {}
        dispatch({ type: "SET_PREVIEW_ERROR", error: errMsg });
        return;
      }
      const data = await res.json();
      if (data.imageBase64) {
        dispatch({
          type: "SET_ROOM_PREVIEW",
          preview: { imageBase64: data.imageBase64, mimeType: data.mimeType ?? "image/png" },
        });
        // Auto-save after manual preview generation
        setTimeout(() => saveCurrentProjectRef.current(), 500);
      } else {
        dispatch({ type: "SET_PREVIEW_ERROR", error: data.error ?? "Failed to generate preview" });
      }
    } catch (err: any) {
      console.error("Preview generation error:", err);
      dispatch({ type: "SET_PREVIEW_ERROR", error: err.message || "Failed to generate room preview" });
    }
  }, [state.uploadedImage, state.styleContext]);

  const addSavedItem = useCallback((product: SavedItem) => {
    dispatch({ type: "ADD_SAVED_ITEM", item: product });
  }, []);

  const removeSavedItem = useCallback((index: number) => {
    dispatch({ type: "REMOVE_SAVED_ITEM", index });
  }, []);

  const unsaveSavedItem = useCallback((title: string) => {
    dispatch({ type: "REMOVE_SAVED_ITEM_BY_TITLE", title });
  }, []);

  const clearSavedItems = useCallback(() => {
    dispatch({ type: "CLEAR_SAVED_ITEMS" });
  }, []);

  const editDesignChoice = useCallback((key: string) => {
    const choice = state.designChoices.find((c) => c.key === key);
    if (!choice || !clientRef.current) return;
    const msg = `Let's change the ${choice.label.toLowerCase()} choice.`;
    dispatch({ type: "ADD_TRANSCRIPT", entry: { role: "user", text: msg, timestamp: Date.now() } });
    clientRef.current.sendText(msg);
  }, [state.designChoices]);

  const resetSession = useCallback(() => {
    // Disconnect if active
    if (clientRef.current) {
      clientRef.current.disconnect();
      audioRef.current?.destroy();
      clientRef.current = null;
      audioRef.current = null;
    }
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    currentProjectIdRef.current = null;
    uploadedImageRef.current = null;
    pauseCameraFramesRef.current = false;
    dispatch({ type: "RESET" });
  }, []);

  const loadProjectSession = useCallback(async (projectId: string) => {
    // Disconnect any active session first
    if (clientRef.current) {
      clientRef.current.disconnect();
      audioRef.current?.destroy();
      clientRef.current = null;
      audioRef.current = null;
    }

    const project = loadStoredProject(projectId);
    if (!project) return;

    const imgs = await loadProjectImages(projectId);

    // Build previewUrl from room photo
    let roomPreviewUrl: string | null = null;
    if (imgs.roomPhoto) {
      roomPreviewUrl = `data:${imgs.roomPhoto.mimeType};base64,${imgs.roomPhoto.base64}`;
      uploadedImageRef.current = imgs.roomPhoto;
    }

    // Build preview data
    let previewData: RoomPreview | null = null;
    if (imgs.previews.length > 0) {
      previewData = {
        imageBase64: imgs.previews[0].imageBase64,
        mimeType: imgs.previews[0].mimeType,
        changes: imgs.previews[0].changes,
        style: imgs.previews[0].style,
      };
    }

    currentProjectIdRef.current = projectId;
    dispatch({ type: "LOAD_PROJECT", project, roomPreviewUrl, previewData });
  }, []);

  const refs: SessionRefs = {
    clientRef,
    audioRef,
    speakingTimeoutRef,
    timerRef,
    fileInputRef,
    uploadedImageRef,
    transcriptRef,
    pauseCameraFramesRef,
    latestCameraFrameRef,
    previewTimerRef,
  };

  const actions: SessionActions = {
    toggleSession,
    disconnectSession,
    sendChat,
    sendMessage,
    toggleMic,
    toggleCamera,
    handleCameraFrame,
    handleCameraCapture,
    handleImageUpload,
    handleImageFile,
    removeUploadedImage,
    generatePreview,
    addSavedItem,
    removeSavedItem,
    unsaveSavedItem,
    clearSavedItems,
    editDesignChoice,
    resetSession,
    loadProjectSession,
  };

  return (
    <SessionContext.Provider value={{ state, dispatch, refs, actions }}>
      {children}
    </SessionContext.Provider>
  );
}
