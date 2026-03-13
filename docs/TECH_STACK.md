# J's Room AI — Tech Stack

## Core Technologies

| Layer | Technology | Version | Why |
|---|---|---|---|
| **Frontend** | Next.js (React) | 14+ | Fast SSR, responsive, works on mobile + desktop browsers |
| **Language (FE)** | TypeScript | 5.x | Type safety for WebSocket message handling |
| **Styling** | Tailwind CSS | 3.x | Rapid UI development, responsive by default |
| **Live AI** | Gemini Live API | v1beta | Real-time bidirectional voice + vision over WebSocket |
| **Model** | gemini-2.0-flash-exp | — | Required for Live API (multimodal live, function calling) |
| **Image Gen** | Gemini 2.5 Flash | — | Native image generation (bonus feature) |
| **SDK** | Google GenAI SDK | @google/genai (JS) | Official SDK, supports Live API WebSocket connection |
| **Backend** | Python + FastAPI | 3.11+ / 0.100+ | Lightweight API server for tool execution |
| **Product Search** | SerpAPI | — | Google Shopping results with structured data |
| **Reference Images** | Unsplash API | — | Free high-quality interior design photos |
| **Database** | Firestore | — | Serverless NoSQL, perfect for session/shopping list storage |
| **Hosting** | Google Cloud Run | — | Serverless container hosting, scales to zero |
| **Container** | Docker | — | Cloud Run deployment |

## API Keys Required

| API | Key Type | Free Tier | Where to Get |
|---|---|---|---|
| **Gemini API** | API key | Free tier available | [aistudio.google.com](https://aistudio.google.com) |
| **SerpAPI** | API key | 250 searches/month free | [serpapi.com](https://serpapi.com) |
| **Unsplash** | Access key | Unlimited (50 req/hr demo) | [unsplash.com/developers](https://unsplash.com/developers) |
| **GCP** | Service account | $300 free credits (new account) | [console.cloud.google.com](https://console.cloud.google.com) |

## Google Cloud Services

| Service | Purpose | Cost |
|---|---|---|
| **Cloud Run** | Host backend API | Free tier: 2M requests/month |
| **Firestore** | Store sessions + shopping lists | Free tier: 1 GiB storage, 50K reads/day |
| **Artifact Registry** | Docker image storage for Cloud Run | Free tier: 500 MB |

## SDK Details

### Google GenAI SDK (Frontend — JavaScript)

```bash
npm install @google/genai
```

Used for:
- Establishing WebSocket connection to Gemini Live API
- Sending audio chunks + video frames
- Receiving audio responses + function calls
- Sending function call results back

Key classes:
- `GoogleGenAI` — client initialization
- `client.live.connect()` — WebSocket session
- `session.send()` — send audio/video/tool responses
- `session.on('message')` — receive audio/tool calls

### Google GenAI SDK (Backend — Python)

```bash
pip install google-genai
```

Used for:
- Gemini 2.5 Flash image generation (bonus feature)
- Any server-side Gemini calls if needed

### SerpAPI

```bash
pip install google-search-results
```

Used for:
- Google Shopping search with structured product data
- Returns: title, price, link, thumbnail, source, rating

### Unsplash

```bash
pip install python-unsplash
# or just use requests with the API directly
```

Used for:
- Searching interior design reference photos
- Returns: image URLs (multiple sizes), photographer credit, download link

## Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@google/genai": "latest",
    "tailwindcss": "^3.0.0"
  }
}
```

## Backend Dependencies

```txt
fastapi>=0.100.0
uvicorn>=0.23.0
google-genai
google-cloud-firestore
google-search-results
requests
python-dotenv
```

## Environment Variables

```env
# Gemini
GEMINI_API_KEY=

# SerpAPI
SERPAPI_KEY=

# Unsplash
UNSPLASH_ACCESS_KEY=

# GCP (for Firestore — auto-detected on Cloud Run)
GOOGLE_CLOUD_PROJECT=
```

## Why Each Choice

| Choice | Reasoning |
|---|---|
| **Direct Gemini Live API** (no ADK) | Lower latency, simpler architecture, single agent with tools is sufficient |
| **SerpAPI** over Google Search grounding | Returns structured shopping data (price, buy link, image) vs. plain web results |
| **Unsplash** over Google Images | Free, high-quality, licensed images. No scraping or API abuse |
| **Gemini 2.5 Flash** for image gen | Native image generation in Gemini, no separate Imagen API needed |
| **Next.js** over plain React | SSR for fast initial load, API routes as fallback, great mobile support |
| **Cloud Run** over App Engine/GKE | Serverless, scales to zero (no cost when idle), simple Docker deploy |
| **Firestore** over SQL | Flexible schema for varied session data, serverless, GCP-native |
| **English primary** | Simplifies system prompts and demo. Gemini handles multilingual natively if needed later |
| **Context compression** | Extends live sessions beyond 2-min audio+video limit without losing context |
