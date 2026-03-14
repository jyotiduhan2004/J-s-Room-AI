"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import CameraFeed from "@/components/CameraFeed";
import ChatPanel from "@/components/ChatPanel";
import VoiceIndicator from "@/components/VoiceIndicator";
import RoomUploader from "@/components/RoomUploader";
import DesignBrief from "@/components/DesignBrief";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import ReferenceGallery from "@/components/ReferenceGallery";
import ProductGallery from "@/components/ProductGallery";
import SavedItemsList from "@/components/SavedItemsList";
import LandingBackground from "@/components/LandingBackground";
import { useSession } from "@/context/SessionContext";

/* ── Landing Page ── */

function LandingPage() {
  const { state, actions, dispatch } = useSession();

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-6 sm:p-6 lg:p-12 overflow-hidden">
      {/* Animated background */}
      <LandingBackground />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {/* Hero */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Design your space with AI
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Upload a room photo, capture with camera, or just describe it
          </p>
        </div>

        {/* Upload zone */}
        <div className="backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 rounded-2xl p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
          <RoomUploader variant="dropzone" onUpload={actions.handleImageFile} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-300/50 dark:bg-slate-600/50" />
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-300/50 dark:bg-slate-600/50" />
        </div>

        {/* Voice session CTA */}
        <div className="text-center space-y-2">
          <button
            onClick={() => {
              dispatch({ type: "SET_PHASE", phase: "active" });
              actions.toggleSession(false);
            }}
            className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/10 dark:shadow-black/10 active:scale-95"
          >
            <span className="material-symbols-outlined !text-lg text-primary">mic</span>
            Start a voice session
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Use your camera to show your room live
          </p>
        </div>

        {/* Or just type */}
        <div className="flex items-center gap-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/60 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/10 dark:shadow-black/10">
          <span className="material-symbols-outlined text-slate-400 !text-lg sm:!text-xl">chat</span>
          <input
            type="text"
            value={state.chatInput}
            onChange={(e) => dispatch({ type: "SET_CHAT_INPUT", value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && state.chatInput.trim()) {
                dispatch({ type: "SET_PHASE", phase: "active" });
                actions.sendChat();
              }
            }}
            placeholder="Describe your room or ask a question..."
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-1 placeholder-slate-400 text-slate-900 dark:text-slate-100 min-w-0"
          />
          <button
            onClick={() => {
              if (state.chatInput.trim()) {
                dispatch({ type: "SET_PHASE", phase: "active" });
                actions.sendChat();
              }
            }}
            disabled={!state.chatInput.trim()}
            className="p-2 rounded-lg bg-primary text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined !text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Workspace: Visual Panel (right side) ── */

function VisualWorkspace() {
  const { state, actions, dispatch } = useSession();
  const isConnected = state.connectionStatus === "connected";

  const confirmedCount = state.designChoices.filter((c) => c.confirmed).length;

  // Determine workspace stage
  const hasPreview = !!state.currentPreview;
  const isGenerating = state.previewStatus === "generating";
  const hasProducts = state.searchResults.length > 0 || state.savedItems.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5 no-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
      {/* Room photo hero */}
      {state.uploadedImage && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {hasPreview ? (
            <BeforeAfterSlider
              beforeSrc={state.uploadedImage.previewUrl}
              afterSrc={`data:${state.currentPreview!.mimeType};base64,${state.currentPreview!.imageBase64}`}
              beforeLabel="Original"
              afterLabel={state.styleContext ? `${state.styleContext} Style` : "AI Redesign"}
            />
          ) : isGenerating ? (
            <div className="relative aspect-video">
              <img
                src={state.uploadedImage.previewUrl}
                alt="Room"
                className="w-full h-full object-cover blur-sm opacity-50 scale-[1.02]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 bg-black/30">
                <div className="relative">
                  <div className="size-10 sm:size-12 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
                  <span className="material-symbols-outlined text-white !text-lg sm:!text-xl absolute inset-0 flex items-center justify-center">auto_awesome</span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-center px-4">
                  <p className="text-xs sm:text-sm font-semibold text-white drop-shadow">Generating your redesign</p>
                  <p className="text-[10px] sm:text-xs text-white/60">This usually takes 10-15 seconds</p>
                </div>
                <div className="h-1 w-40 sm:w-56 rounded-full overflow-hidden bg-white/15">
                  <div className="h-full w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-shimmer bg-[length:200%_100%]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={state.uploadedImage.previewUrl}
                alt="Your room"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-slate-900/70 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                Your Room
              </div>
              <button
                onClick={actions.removeUploadedImage}
                className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 rounded-full bg-slate-900/50 text-white/80 hover:text-white hover:bg-slate-900/70 transition-colors active:scale-90"
              >
                <span className="material-symbols-outlined !text-sm">close</span>
              </button>
              {/* Analyzing overlay */}
              {state.isImageAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3 bg-black/40 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white !text-xl sm:!text-2xl animate-spin">progress_activity</span>
                  </div>
                  <div className="h-1 w-36 sm:w-48 rounded-full overflow-hidden bg-white/20">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer bg-[length:200%_100%]" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white drop-shadow">Analyzing your room...</p>
                  <p className="text-[10px] sm:text-xs text-white/60">AI is identifying furniture, colors & layout</p>
                </div>
              )}
            </div>
          )}

          {/* Preview actions */}
          {hasPreview && (
            <div className="p-2.5 sm:p-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 sm:space-y-3">
              {/* Changes applied */}
              {state.currentPreview?.changes && state.currentPreview.changes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Changes applied:</p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {state.currentPreview.changes.slice(0, 5).map((c, i) => (
                      <span key={i} className="text-[10px] sm:text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={`data:${state.currentPreview!.mimeType};base64,${state.currentPreview!.imageBase64}`}
                  download="room-redesign.png"
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined !text-sm">download</span>
                  Download
                </a>
                <button
                  onClick={actions.generatePreview}
                  disabled={isGenerating}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 active:scale-95"
                >
                  <span className="material-symbols-outlined !text-sm">refresh</span>
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Preview error */}
          {state.previewError && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-t border-red-100 dark:border-red-900/30">
              <span className="material-symbols-outlined !text-sm">error</span>
              <span className="line-clamp-2">{state.previewError}</span>
            </div>
          )}
        </div>
      )}

      {/* Generate preview button (only when uploaded but no preview) */}
      {state.uploadedImage && !hasPreview && !isGenerating && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Style (e.g. Scandinavian, Bohemian...)"
              value={state.styleContext}
              onChange={(e) => dispatch({ type: "SET_STYLE_CONTEXT", value: e.target.value })}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-0"
            />
            <button
              onClick={actions.generatePreview}
              className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined !text-base">auto_awesome</span>
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload zone (when no image) */}
      {!state.uploadedImage && (
        <RoomUploader variant="compact" onUpload={actions.handleImageFile} />
      )}

      {/* Design Brief */}
      {confirmedCount > 0 && (
        <DesignBrief
          choices={state.designChoices}
          onEdit={actions.editDesignChoice}
          disabled={!isConnected}
        />
      )}

      {/* Reference images */}
      {state.referenceImages.length > 0 && (
        <ReferenceGallery images={state.referenceImages} />
      )}

      {/* Find products CTA — after preview, before products load */}
      {hasPreview && !hasProducts && (
        <button
          onClick={() => {
            if (isConnected) {
              actions.sendMessage("Now find me affordable products for this redesign on Indian shopping sites. Search for ALL the key items — furniture, decor, lighting, textiles, rugs — everything needed to achieve this design. Search for each category separately.");
            }
          }}
          disabled={!isConnected || state.isAiTyping}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary/10 dark:bg-primary/15 hover:bg-primary/20 dark:hover:bg-primary/25 border border-primary/20 dark:border-primary/30 rounded-xl sm:rounded-2xl text-primary text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 active:scale-[0.98]"
        >
          {state.isAiTyping ? (
            <>
              <span className="material-symbols-outlined !text-lg animate-spin">progress_activity</span>
              Searching for products...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined !text-lg">shopping_bag</span>
              Find products for this design
            </>
          )}
        </button>
      )}

      {/* Products & saved items */}
      {hasProducts && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {state.searchResults.length > 0 && (
            <ProductGallery
              products={state.searchResults}
              onSave={actions.addSavedItem}
              onUnsave={actions.unsaveSavedItem}
              savedTitles={new Set(state.savedItems.map((i) => i.title))}
            />
          )}
          <SavedItemsList
            items={state.savedItems}
            onRemove={actions.removeSavedItem}
            onClear={actions.clearSavedItems}
          />
        </div>
      )}
    </div>
  );
}

/* ── Workspace: Conversation Panel (left side) ── */

function ConversationPanel() {
  const { state, actions, dispatch } = useSession();
  const isConnected = state.connectionStatus === "connected";
  const isConnecting = state.connectionStatus === "connecting";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 lg:border-r border-slate-200 dark:border-slate-800">
      {/* Connection status bar */}
      {isConnecting && (
        <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-medium shrink-0 animate-slide-up">
          <span className="material-symbols-outlined !text-sm animate-spin">progress_activity</span>
          Connecting to AI designer...
        </div>
      )}
      {isConnected && state.transcript.length === 0 && (
        <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-xs font-medium shrink-0 animate-slide-up">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Connected — waiting for AI...
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ChatPanel
          transcript={state.transcript}
          isAiTyping={state.isAiTyping}
        />
      </div>

      {/* Voice indicator */}
      {isConnected && state.voiceState !== "idle" && (
        <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 shrink-0">
          <VoiceIndicator state={state.voiceState} isMicOn={state.isMicOn} />
        </div>
      )}

      {/* Input area */}
      <div className="p-2 sm:p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 border border-slate-200 dark:border-slate-700">
          {/* Attachment */}
          <RoomUploader variant="button" onUpload={actions.handleImageFile} />

          {/* Text input */}
          <input
            type="text"
            value={state.chatInput}
            onChange={(e) => dispatch({ type: "SET_CHAT_INPUT", value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") actions.sendChat();
            }}
            placeholder="Message AI designer..."
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-2 placeholder-slate-400 text-slate-900 dark:text-slate-100 min-w-0"
          />

          {/* Mic button */}
          {!isConnected ? (
            <button
              onClick={() => actions.toggleSession(false)}
              disabled={isConnecting}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all shrink-0 active:scale-90"
              title="Start voice session"
            >
              <span className="material-symbols-outlined !text-lg">
                {isConnecting ? "progress_activity" : "mic"}
              </span>
            </button>
          ) : state.isMicOn ? (
            <button
              onClick={actions.toggleMic}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all shrink-0 active:scale-90"
              title="Mute microphone"
            >
              <span className="material-symbols-outlined !text-lg">mic</span>
            </button>
          ) : (
            <button
              onClick={actions.toggleMic}
              className="p-1.5 sm:p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all shrink-0 active:scale-90"
              title="Unmute microphone"
            >
              <span className="material-symbols-outlined !text-lg">mic_off</span>
            </button>
          )}

          {/* End session button (when connected) */}
          {isConnected && (
            <button
              onClick={() => actions.toggleSession()}
              className="p-1.5 sm:p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all shrink-0 active:scale-90"
              title="End session"
            >
              <span className="material-symbols-outlined !text-lg">stop_circle</span>
            </button>
          )}

          {/* Send */}
          <button
            onClick={actions.sendChat}
            disabled={!state.chatInput.trim() || isConnecting}
            className="p-1.5 sm:p-2 rounded-lg bg-primary text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-90"
            title="Send message"
          >
            <span className="material-symbols-outlined !text-lg">send</span>
          </button>
        </div>

        {/* Camera toggle (small, secondary) */}
        {isConnected && (
          <div className="flex items-center gap-2 mt-1.5 sm:mt-2 px-1">
            <button
              onClick={actions.toggleCamera}
              className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors active:scale-95 ${
                state.isCameraOn
                  ? "text-primary"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined !text-sm">
                {state.isCameraOn ? "videocam" : "videocam_off"}
              </span>
              {state.isCameraOn ? "Camera on" : "Camera off"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Error Banner ── */

function ErrorBanner() {
  const { state, dispatch } = useSession();
  if (!state.error) return null;

  return (
    <div className="mx-2 sm:mx-4 mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm animate-slide-up">
      <span className="material-symbols-outlined !text-lg shrink-0 mt-0.5">error</span>
      <span className="flex-1 line-clamp-3">{state.error}</span>
      <button onClick={() => dispatch({ type: "SET_ERROR", error: null })} className="text-red-400 hover:text-red-300 shrink-0">
        <span className="material-symbols-outlined !text-lg">close</span>
      </button>
    </div>
  );
}

/* ── Active Workspace ── */

function ActiveWorkspace() {
  const { state, actions } = useSession();
  const [mobileView, setMobileView] = useState<"chat" | "workspace">("chat");

  const hasVisualContent = !!(
    state.uploadedImage ||
    state.currentPreview ||
    state.referenceImages.length > 0 ||
    state.searchResults.length > 0 ||
    state.savedItems.length > 0 ||
    state.designChoices.some((c) => c.confirmed)
  );

  return (
    <>
      {/* Error banner */}
      <ErrorBanner />

      {/* Mobile view toggle */}
      {hasVisualContent && (
        <div className="flex lg:hidden border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
          <button
            onClick={() => setMobileView("chat")}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
              mobileView === "chat"
                ? "border-b-2 border-primary text-primary"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined !text-base sm:!text-lg">chat</span>
            Chat
          </button>
          <button
            onClick={() => setMobileView("workspace")}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
              mobileView === "workspace"
                ? "border-b-2 border-primary text-primary"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined !text-base sm:!text-lg">space_dashboard</span>
            Room
          </button>
        </div>
      )}

      {/* Desktop: two-panel layout / Mobile: tabbed */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-h-0">
        {/* Conversation — left on desktop, conditionally shown on mobile */}
        <div className={`w-full lg:w-[45%] xl:w-[40%] flex flex-col min-h-0 ${
          mobileView !== "chat" && hasVisualContent ? "hidden lg:flex" : "flex"
        }`}>
          <ConversationPanel />
        </div>

        {/* Visual workspace — right on desktop, conditionally shown on mobile */}
        <div className={`w-full lg:w-[55%] xl:w-[60%] flex flex-col min-h-0 ${
          mobileView !== "workspace" && hasVisualContent ? "hidden lg:flex" : !hasVisualContent ? "hidden lg:flex" : "flex"
        }`}>
          <VisualWorkspace />
        </div>
      </div>

      {/* Camera PiP */}
      <CameraFeed
        isActive={state.isCameraOn}
        onCapture={actions.handleCameraCapture}
      />
    </>
  );
}

/* ── Main Page ── */

export default function Home() {
  const { state } = useSession();

  return (
    <AppShell>
      {state.sessionPhase === "landing" ? <LandingPage /> : <ActiveWorkspace />}
    </AppShell>
  );
}
