# J's Room AI — System Architecture

## Overview

J's Room AI uses a **split architecture**: the browser connects directly to Gemini Live API via WebSocket for real-time voice+vision, and separately talks to a Cloud Run backend for product search, reference images, and session storage.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    User's Browser (React/Next.js)                   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Camera   │  │ Mic      │  │ UI Panel │  │ Shopping/Reference │  │
│  │ (1 FPS)  │  │ (Audio)  │  │ (Chat +  │  │ Cards Display      │  │
│  │          │  │          │  │  Images) │  │                    │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └────────────────────┘  │
│       │              │                                              │
│       └──────┬───────┘                                              │
│              │                                                      │
│    ┌─────────▼──────────┐         ┌─────────────────────────┐       │
│    │ Gemini Live Client │         │ Backend API Client      │       │
│    │ (WebSocket)        │         │ (REST / fetch)          │       │
│    └─────────┬──────────┘         └────────────┬────────────┘       │
└──────────────┼─────────────────────────────────┼────────────────────┘
               │                                 │
               │ WebSocket                       │ HTTPS
               │ (audio + video frames           │
               │  bidirectional)                  │
               ▼                                 ▼
┌──────────────────────────┐     ┌────────────────────────────────────┐
│   Gemini Live API        │     │   Cloud Run Backend (Python)       │
│   (Google servers)       │     │                                    │
│                          │     │   POST /api/products/search        │
│  - gemini-2.0-flash-exp  │     │     → SerpAPI Google Shopping      │
│  - Bidirectional audio   │     │                                    │
│  - Video frame input     │     │   POST /api/references/search      │
│  - Function calling      │     │     → Unsplash API                 │
│  - Context compression   │     │                                    │
│  - Interruption handling │     │   POST /api/image/generate         │
│                          │     │     → Gemini 2.5 Flash             │
│  Tools declared:         │     │                                    │
│  - search_products       │     │   POST /api/session/save           │
│  - search_references     │     │     → Firestore                    │
│  - generate_room_image   │     │                                    │
│  - create_shopping_list  │     │   GET  /api/session/:id            │
└──────────┬───────────────┘     │     → Firestore                    │
           │                     │                                    │
           │ Function call       └──────────┬─────────────────────────┘
           │ responses go back              │
           │ through the browser            │
           │ (client executes them          │
           │  via backend API)              ▼
           │                     ┌────────────────────────┐
           └─────────────────────│   Firestore            │
                                 │   - sessions/          │
                                 │   - shopping_lists/    │
                                 └────────────────────────┘
```

## Data Flow

### 1. Live Session (Voice + Vision)

```
Browser                         Gemini Live API
   │                                  │
   │──── WebSocket connect ──────────►│
   │     (with system instruction,    │
   │      tool declarations)          │
   │                                  │
   │──── Audio chunks ───────────────►│  (continuous mic stream)
   │──── Video frame (1 FPS) ────────►│  (camera capture as base64 JPEG)
   │                                  │
   │◄─── Audio response ─────────────│  (agent speaks back)
   │◄─── Function call request ──────│  (e.g., search_products)
   │                                  │
   │  [Browser executes function      │
   │   by calling Cloud Run backend]  │
   │                                  │
   │──── Function call result ───────►│  (product data, image URLs)
   │                                  │
   │◄─── Audio continues ────────────│  (agent discusses results)
   │                                  │
```

### 2. Function Call Execution (Client-Side)

When Gemini issues a function call, the **browser** handles it:

1. Gemini sends `tool_call` with name + arguments
2. Browser receives it via WebSocket
3. Browser makes REST call to Cloud Run backend
4. Backend calls external API (SerpAPI / Unsplash / Gemini image gen)
5. Backend returns results to browser
6. Browser sends `tool_response` back to Gemini via WebSocket
7. Browser also renders results in the UI (product cards, reference images)
8. Gemini continues the conversation using the tool response

### 3. Session Management

- **Context compression** is enabled in the Gemini Live API config
- This allows sessions to extend beyond the default 2-minute audio+video limit
- Gemini compresses older context automatically, keeping recent conversation sharp
- Shopping lists and session summaries are saved to Firestore via the backend

## Component Breakdown

### Frontend (React/Next.js)

| Component | Responsibility |
|---|---|
| `CameraFeed` | Captures video, sends 1 frame/sec as base64 JPEG |
| `AudioManager` | Handles mic input/output, streams audio to/from WebSocket |
| `GeminiLiveClient` | WebSocket connection, message routing, function call handling |
| `ChatPanel` | Displays conversation transcript + agent responses |
| `ReferenceGallery` | Shows style reference images from Unsplash |
| `ProductCards` | Shows shopping results with prices and buy links |
| `ShoppingList` | Aggregated shopping list with total and budget tracking |
| `StyleSelector` | Quick-select buttons for style presets |

### Backend (Cloud Run — Python/FastAPI)

| Module | Responsibility |
|---|---|
| `api/products.py` | SerpAPI Google Shopping integration |
| `api/references.py` | Unsplash API integration |
| `api/image_gen.py` | Gemini 2.5 Flash image generation |
| `api/session.py` | Firestore session CRUD |
| `config.py` | API keys, Firestore client setup |

### External Services

| Service | Purpose | Auth |
|---|---|---|
| Gemini Live API | Real-time voice + vision conversation | Gemini API key |
| SerpAPI | Google Shopping product search | SerpAPI key |
| Unsplash API | Style reference images | Unsplash access key |
| Gemini 2.5 Flash | Room image generation (bonus) | Gemini API key |
| Firestore | Session + shopping list storage | GCP service account |

## Key Architectural Decisions

1. **Direct browser → Gemini Live API** (not proxied through backend): Reduces latency for real-time voice. The backend only handles tool execution.

2. **Client-side function call execution**: Browser receives function calls from Gemini, calls the backend, then returns results to Gemini. This lets the UI update simultaneously.

3. **Context compression enabled**: Extends sessions beyond 2-min audio+video hard limit. Essential for a full interior design conversation.

4. **SerpAPI over Google Search grounding**: Structured product data with prices, images, and buy links. Google Search grounding returns web results, not shopping data.

5. **Unsplash over Google Images**: Free, high-quality, properly licensed reference images. No scraping needed.

6. **No ADK**: Direct Gemini Live API with function calling is simpler and lower-latency than routing through ADK agents. Single-agent architecture with tools.
