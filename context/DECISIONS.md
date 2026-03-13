# J's Room AI — Key Design Decisions

## 1. Next.js 14 (not 15+)
- **Why**: Node 18.19.1 is installed; Next.js 15+ requires Node >= 20.9.0
- **Trade-off**: Misses App Router improvements in 15, but fully functional

## 2. gemini-2.0-flash-exp model
- **Why**: Free experimental tier — zero cost
- **Trade-off**: May have rate limits or be deprecated; switch to `gemini-2.0-flash` if needed

## 3. Client-side API key (NEXT_PUBLIC_)
- **Why**: Gemini Live API uses WebSocket from browser directly; can't proxy through server
- **Risk**: Key exposed in client bundle — acceptable for hackathon, add server proxy for production
- **Mitigation**: Restrict key in Google Cloud Console to specific APIs/domains

## 4. sendRealtimeInput() with Blob (not .send())
- **Why**: `@google/genai` SDK v0.7+ uses `session.sendRealtimeInput({ media: Blob })` for streaming
- **Lesson**: SDK docs and actual API differ; verified from SDK source (`genai.d.ts`)

## 5. ScriptProcessorNode for mic audio
- **Why**: Gives raw PCM Float32 access needed for Gemini's PCM16@16kHz format
- **Trade-off**: Deprecated API, but AudioWorklet requires separate file + more complexity
- **Future**: Migrate to AudioWorklet if performance issues arise

## 6. Camera: 1 FPS at 60% JPEG quality
- **Why**: Balances visual context for Gemini vs token/bandwidth cost
- **Configurable**: `fps` prop on CameraFeed component

## 7. PCM16@16kHz input, PCM16@24kHz output
- **Why**: These are Gemini Live API's required audio formats
- **Input**: Mic → Float32 → PCM16 → base64 → Blob → sendRealtimeInput
- **Output**: base64 from response → ArrayBuffer → PCM16 → Float32 → AudioBuffer → play

## 8. Hydration guard in CameraFeed
- **Why**: `<video>` element causes SSR/client mismatch in Next.js
- **Solution**: `mounted` state + useEffect; render placeholder div on server, video on client

## 9. Single AudioContext per playback chunk
- **Why**: Simple queue-based playback; each chunk gets its own AudioContext
- **Trade-off**: Many AudioContext creates; could optimize with single shared context
- **Future**: Pool or reuse AudioContext if audio glitches occur

## 10. All env vars in parent .env + frontend/.env.local
- **Why**: Next.js only reads .env from its own directory; parent .env for other services later
- **Pattern**: Keep .env.local in frontend/ with just NEXT_PUBLIC_ vars
