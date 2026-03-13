# J's Room AI — File Manifest

## Root Level
| File | Purpose |
|------|---------|
| `.env` | All API keys (Gemini, SerpAPI, Unsplash, GCP) |
| `PROJECT_PLAN.md` | Original hackathon plan |
| `keysss/js-room-ai-*.json` | GCP service account key |

## context/
| File | Purpose |
|------|---------|
| `PROJECT_STATE.md` | Full project context, architecture, status |
| `FILE_MANIFEST.md` | This file — every file with description |
| `DECISIONS.md` | Key design decisions with rationale |

## docs/ (pre-existing architecture docs)
| File | Purpose |
|------|---------|
| `API_DESIGN.md` | API endpoint design |
| `ARCHITECTURE.md` | System architecture |
| `DEVELOPMENT_FLOW.md` | Dev workflow |
| `SUBMISSION_CHECKLIST.md` | Hackathon submission checklist |
| `TECH_STACK.md` | Technology choices |

## frontend/ — Config
| File | Purpose |
|------|---------|
| `package.json` | Next.js 14.2.21, @google/genai ^0.7.0, React 18 |
| `.env.local` | `NEXT_PUBLIC_GEMINI_API_KEY` for client-side access |
| `tsconfig.json` | TS config with `@/*` path alias |
| `tailwind.config.ts` | Tailwind scanning `./src/**` |
| `next.config.js` | Empty (defaults) |
| `postcss.config.js` | Tailwind + autoprefixer |

## frontend/src/app/
| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout, `<html>` + `<body>`, metadata |
| `globals.css` | Tailwind directives + dark base styles |
| `page.tsx` | **Main page** — state management, wires all components + Gemini client |

## frontend/src/components/
| File | Purpose |
|------|---------|
| `CameraFeed.tsx` | getUserMedia camera, captures 1 JPEG frame/sec, sends to Gemini |
| `ChatPanel.tsx` | Scrollable transcript of user/agent messages |
| `ControlBar.tsx` | 3 buttons: mic toggle, start/stop session, camera toggle |

## frontend/src/lib/
| File | Purpose |
|------|---------|
| `gemini-live.ts` | `GeminiLiveClient` class — connects via `@google/genai` SDK, sends audio/images via `sendRealtimeInput()`, handles responses |
| `audio-streamer.ts` | `AudioStreamer` class — mic capture (PCM16@16kHz via ScriptProcessorNode), playback queue (PCM16@24kHz) |
