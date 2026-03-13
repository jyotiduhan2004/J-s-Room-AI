# J's Room AI — Development Flow

## Timeline: 6 Days (March 11–17, 2026)

---

## Day 1 (March 11) — Foundation + Live Voice

**Goal**: Browser talks to Gemini Live API with voice. Camera feed displays locally.

### Tasks
- [ ] Set up GCP account (claim $300 free credits)
- [ ] Get all API keys (Gemini, SerpAPI, Unsplash)
- [ ] Init Next.js project with TypeScript + Tailwind
- [ ] Build `AudioManager` — mic capture, audio playback
- [ ] Build `GeminiLiveClient` — WebSocket connection using @google/genai SDK
- [ ] Wire up: speak → Gemini responds with voice
- [ ] Build `CameraFeed` — capture video, display locally
- [ ] Test: basic voice conversation with Gemini works in browser

### Deliverable
Can have a voice conversation with Gemini through the browser.

### Dependencies
- Gemini API key (must have before anything else)

---

## Day 2 (March 12) — Vision + Room Analysis

**Goal**: Gemini sees the room through camera and analyzes it.

### Tasks
- [ ] Send camera frames to Gemini (1 FPS, base64 JPEG, ~50KB each)
- [ ] Write system instruction for interior designer persona
- [ ] Test: point camera at room → Gemini describes what it sees
- [ ] Refine system prompt for gap identification (lighting, layout, color, etc.)
- [ ] Build basic `ChatPanel` UI — show text transcript alongside voice
- [ ] Test: full room analysis flow (camera + voice)

### Deliverable
Point camera at room → agent analyzes and suggests improvements via voice.

### Dependencies
- Day 1 (voice + camera working)

---

## Day 3 (March 13) — Function Calling + Reference Images + Backend

**Goal**: Agent calls tools mid-conversation. Reference images appear in UI.

### Tasks
- [ ] Set up FastAPI backend with project structure
- [ ] Implement `POST /api/references/search` (Unsplash API)
- [ ] Implement `POST /api/products/search` (SerpAPI Google Shopping)
- [ ] Declare tools in Gemini Live API config (`search_references`, `search_products`)
- [ ] Build client-side function call handler (receive tool_call → call backend → return tool_response)
- [ ] Build `ReferenceGallery` component — display reference images in UI
- [ ] Build `StyleSelector` — quick buttons for style presets
- [ ] Test: "Show me Scandinavian living rooms" → agent calls tool → images appear
- [ ] Enable context compression in Live API config

### Deliverable
User says a style → agent searches → reference images appear on screen. Products searchable.

### Dependencies
- Day 2 (vision working)
- SerpAPI + Unsplash keys

---

## Day 4 (March 14) — Shopping List + End-to-End Flow

**Goal**: Complete flow from room analysis → shopping list with buy links.

### Tasks
- [ ] Build `ProductCards` component — show products with price, image, buy link
- [ ] Build `ShoppingList` component — aggregated list with budget tracking
- [ ] Implement `create_shopping_list` tool logic
- [ ] Implement `POST /api/session/save` and `GET /api/session/:id` (Firestore)
- [ ] Wire up complete flow: analyze room → suggest style → show references → refine → shopping list
- [ ] Test end-to-end with a real room
- [ ] Fix UI layout for mobile (responsive)

### Deliverable
Complete working flow. Point camera → talk → get shopping list with real product links.

### Dependencies
- Day 3 (function calling + backend APIs)

---

## Day 5 (March 15) — Image Gen (Bonus) + Polish + Deploy

**Goal**: Bonus image generation working. App deployed on Cloud Run.

### Tasks
- [ ] Implement `POST /api/image/generate` (Gemini 2.5 Flash image gen)
- [ ] Declare `generate_room_image` tool in Gemini config
- [ ] Test: agent generates redesigned room visualization
- [ ] If image quality is poor → gracefully skip (agent says "let me show you references instead")
- [ ] UI polish: loading states, error handling, smooth transitions
- [ ] Write Dockerfile for backend
- [ ] Deploy backend to Cloud Run
- [ ] Configure CORS for frontend → Cloud Run
- [ ] Deploy frontend (Vercel or Cloud Run)
- [ ] Test deployed version end-to-end

### Deliverable
App is live on the internet. Bonus image gen works (or gracefully degrades).

### Dependencies
- Day 4 (complete flow)
- GCP account with Cloud Run enabled

---

## Day 6 (March 16) — Demo Video + Submission

**Goal**: Record demo, write README, submit on Devpost.

### Tasks
- [ ] Write README with setup instructions (spin-up guide)
- [ ] Record demo video (3–4 minutes, see SUBMISSION_CHECKLIST.md)
- [ ] Show architecture diagram in video
- [ ] Show Cloud Run deployment in video
- [ ] Push code to public GitHub repo
- [ ] Submit on Devpost before March 17 deadline
- [ ] (Bonus) Write blog post with #GeminiLiveAgentChallenge
- [ ] (Bonus) Join GDG and link profile

### Deliverable
Submitted on Devpost. Done.

### Dependencies
- Day 5 (deployed app)

---

## Dependency Graph

```
Day 1: Voice ─────────────┐
                           ▼
Day 2: Vision + Analysis ──┐
                           ▼
Day 3: Function Calling + Backend APIs ──┐
                                         ▼
Day 4: Shopping List + E2E Flow ─────────┐
                                         ▼
Day 5: Image Gen + Polish + Deploy ──────┐
                                         ▼
Day 6: Demo + Submit
```

Each day builds on the previous. No parallel workstreams — it's a solo project.

---

## Testing Strategy

| What | How | When |
|---|---|---|
| Voice I/O | Manual: speak, verify response | Day 1 |
| Camera → Gemini | Manual: point at objects, verify description | Day 2 |
| Function calling | Manual: trigger tool via voice, check UI | Day 3 |
| SerpAPI responses | Manual: verify product data, links work | Day 3 |
| Unsplash responses | Manual: verify images load, are relevant | Day 3 |
| End-to-end flow | Manual: full conversation from analysis to shopping list | Day 4 |
| Mobile responsive | Test on phone browser (Chrome) | Day 4 |
| Deployed version | Test on Cloud Run URL | Day 5 |
| Image generation | Manual: verify quality, fallback if bad | Day 5 |

No unit tests — hackathon pace. All testing is manual + iterative.

---

## Deployment Steps

### Backend (Cloud Run)

```bash
# 1. Build Docker image
docker build -t jsroomai-backend .

# 2. Tag for Artifact Registry
docker tag jsroomai-backend gcr.io/PROJECT_ID/jsroomai-backend

# 3. Push
docker push gcr.io/PROJECT_ID/jsroomai-backend

# 4. Deploy to Cloud Run
gcloud run deploy jsroomai-backend \
  --image gcr.io/PROJECT_ID/jsroomai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SERPAPI_KEY=xxx,UNSPLASH_ACCESS_KEY=xxx,GEMINI_API_KEY=xxx
```

### Frontend (Vercel — simplest)

```bash
# Push to GitHub → connect to Vercel → auto-deploy
# Set env var: NEXT_PUBLIC_BACKEND_URL=<Cloud Run URL>
# Set env var: NEXT_PUBLIC_GEMINI_API_KEY=<key>
```

### Alternative: Frontend on Cloud Run too

```bash
# Same Docker build + deploy flow as backend
# Keeps everything on GCP (better for hackathon judging)
```
