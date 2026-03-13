# J's Room AI — Project State

## What It Is
A live AI interior designer that sees your room through camera and has voice conversations using Gemini Live API. Built for a Devpost hackathon (Gemini category).

## Current Status: Day 1 Frontend — WORKING
- Next.js 14 app running at `http://localhost:3000`
- Gemini Live API integration (voice + camera) functional
- Start command: `cd frontend && npm run dev`

## Tech Stack
- **Framework**: Next.js 14.2.21 (Node 18 compatible)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **AI**: `@google/genai` SDK v0.7+ — Gemini Live API
- **Model**: `gemini-2.0-flash-exp` (free experimental tier — budget-friendly)

## Project Structure
```
/mnt/c/Users/jyoti/Downloads/Devpost hackathons/Gemini/
├── .env                          # All API keys (parent level)
├── keysss/                       # GCP service account key
├── docs/                         # Architecture docs (pre-existing)
├── context/                      # This folder — project context
│   ├── PROJECT_STATE.md          # ← You are here
│   ├── FILE_MANIFEST.md          # Every file with description
│   └── DECISIONS.md              # Key design decisions
└── frontend/
    ├── package.json              # Next.js 14 + @google/genai
    ├── .env.local                # NEXT_PUBLIC_GEMINI_API_KEY
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── postcss.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx        # Root layout, metadata
        │   ├── globals.css       # Tailwind imports + base styles
        │   └── page.tsx          # Main page — orchestrates all components
        ├── components/
        │   ├── CameraFeed.tsx    # Camera capture, 1 frame/sec as JPEG
        │   ├── ChatPanel.tsx     # Conversation transcript display
        │   └── ControlBar.tsx    # Start/stop, mute mic, toggle camera
        └── lib/
            ├── gemini-live.ts    # GeminiLiveClient — WebSocket via SDK
            └── audio-streamer.ts # Mic recording (PCM16@16kHz) + playback (24kHz)
```

## API Keys (in .env and frontend/.env.local)
- `NEXT_PUBLIC_GEMINI_API_KEY` — Gemini API (currently set)
- `SERPAPI_KEY` — Google Shopping search (for later)
- `UNSPLASH_ACCESS_KEY` / `UNSPLASH_SECRET_KEY` — Reference images (for later)
- GCP service account in `keysss/`

## How It Works (Day 1 Flow)
1. User clicks "Start Design Session"
2. `GeminiLiveClient` connects to Gemini Live API via `@google/genai` SDK
3. `AudioStreamer` captures mic audio as PCM16@16kHz, sends via `session.sendRealtimeInput()`
4. `CameraFeed` captures 1 frame/sec as base64 JPEG, sends via `session.sendRealtimeInput()`
5. Gemini responds with audio (PCM16@24kHz) — played back through AudioStreamer
6. Text transcript (if any) shown in ChatPanel

## Key Technical Decisions
1. **Next.js 14** (not 15+) because Node 18.19.1 is installed and Next 15+ needs Node 20+
2. **`gemini-2.0-flash-exp`** — free model, keeps budget at zero
3. **`sendRealtimeInput({ media: Blob })`** — correct SDK method (NOT `.send()`)
4. **ScriptProcessorNode** for mic — deprecated but widely supported, gives raw PCM access
5. **1 frame/sec camera** at 60% JPEG quality — balances visual context vs token cost
6. **Client-side hydration guard** in CameraFeed — `mounted` state prevents SSR mismatch with `<video>`

## Bugs Fixed
- **Hydration error**: `<video>` tag mismatch between server/client → added `mounted` state guard
- **`session.send is not a function`**: SDK uses `sendRealtimeInput()` with Blob, not `.send()` with raw data
- **TypeScript `Float32Array<ArrayBuffer>`**: Removed generic parameter for Node 18 TS compat
- **`copyToChannel` type error**: Wrapped in `new Float32Array()` to satisfy ArrayBuffer type

## What's Next (Future Days)
- Image generation for room mockups
- Product search integration (SerpAPI)
- Shopping list / recommendations panel
- Style preference UI
- Before/after visualization
