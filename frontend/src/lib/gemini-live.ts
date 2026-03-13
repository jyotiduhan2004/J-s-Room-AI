import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are J's Room AI — a live AI interior designer on a voice call.

RULES:
- 1-2 short sentences per turn. No meta-commentary. No internal narration.
- Respond instantly. Stop when interrupted.
- You can see the room via camera and any uploaded photo.

TOOLS: search_references, search_products, generate_room_preview, create_shopping_list.

DESIGN INTERVIEW — before calling generate_room_preview you MUST ask and confirm ALL of:
1. Overall style (e.g. Bohemian, Scandinavian, Modern Minimalist)
2. Wall color / color palette (primary + accent)
3. Ceiling — keep as-is, or change? (paint color, add beams, change light fixture?)
4. Flooring — keep or change? (rug, new flooring material?)
5. Key furniture pieces to add or replace (be specific: "replace red bedsheet with white linen duvet")
6. What to keep from the current room
7. Lighting (natural light, add lamps, pendant lights?)
8. Budget per item or total remaining budget

Ask 1-2 questions at a time in natural conversation. Never ask all 8 at once.
After collecting all answers, briefly SUMMARIZE the full plan and ask "Shall I generate the preview now?"
Only call generate_room_preview AFTER the user says yes.

REGENERATION RULE: If the user is unhappy with a preview and wants changes, ask what they want to change, then CALL generate_room_preview AGAIN with updated parameters. Never say "generating now" without actually calling the tool.

LAYOUT RULE: The generated image must keep the EXACT same room layout as the original photo — same window position, same wall arrangement, same furniture positions. Only change colors, textures, fabrics, and decorative items. ALWAYS include in keep[]: every fixed element you can clearly see. Only mention elements you can actually see in the room — never assume or guess that something exists (e.g. don't say "keep the AC" if you can't see one).

When calling generate_room_preview, pass ALL confirmed details:
- changes[]: every specific SURFACE/DECOR change (e.g. "change wall color to warm beige", "add jute rug")
- style: overall style name
- color_palette: confirmed colors
- wall_color: confirmed wall color
- ceiling: ceiling decision
- floor: flooring decision
- lighting: lighting plan
- keep[]: ALL fixed elements — furniture positions, AC, TV, PC desk, posters, window side, structural elements

TOOL RULES:
- Call search_references to show inspiration images for a style.
- Call search_products when user wants to buy, find items, or asks for prices/shopping links. NEVER quote a price or price range without calling search_products first.
- Call create_shopping_list ONLY after calling search_products for each item — use the real prices from search results, not estimates.

Flow: Greet → analyze room → design interview (questions 1-8) → summarize + confirm → generate preview.`;

export type TranscriptEntry = {
  role: "user" | "agent";
  text: string;
  timestamp: number;
};

export type GeminiLiveCallbacks = {
  onAudioOutput: (audioData: ArrayBuffer) => void;
  onTranscript: (entry: TranscriptEntry) => void;
  onTranscriptStream: (role: "user" | "agent", text: string) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onConnectionChange: (connected: boolean) => void;
  onError: (error: string) => void;
  onToolResult?: (toolName: string, result: any) => void;
  getUploadedImage?: () => { base64: string; mimeType: string } | null;
};

export class GeminiLiveClient {
  private client: GoogleGenAI;
  private session: any = null;
  private callbacks: GeminiLiveCallbacks;
  private isConnected = false;
  private isSpeaking = false;
  private currentAgentText = "";
  private currentUserText = "";
  private rawMsgCount = 0;

  constructor(apiKey: string, callbacks: GeminiLiveCallbacks) {
    this.client = new GoogleGenAI({ apiKey });
    this.callbacks = callbacks;
  }

  async connect() {
    try {
      // Capture the real WebSocket before SDK creates it.
      // This lets us: (1) inject transcription config into setup,
      // (2) read raw messages for transcription data the SDK strips.
      const RealWebSocket = window.WebSocket;
      let capturedWs: WebSocket | null = null as WebSocket | null;
      let setupPatched = false;

      // Temporary proxy — captures the WS instance and intercepts first send
      const self = this;
      // @ts-ignore
      window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
        const ws = new RealWebSocket(url, protocols);
        capturedWs = ws;

        // Intercept send to inject transcription config into setup message
        const origSend = ws.send.bind(ws);
        ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
          if (!setupPatched && typeof data === "string") {
            try {
              const msg = JSON.parse(data);
              if (msg.setup) {
                msg.setup.outputAudioTranscription = {};
                msg.setup.inputAudioTranscription = {};
                msg.setup.tools = [{
                  functionDeclarations: [
                    {
                      name: "search_references",
                      description: "Search for interior design reference images by style",
                      parameters: {
                        type: "object",
                        properties: {
                          query: { type: "string", description: "e.g. 'scandinavian living room'" }
                        },
                        required: ["query"]
                      }
                    },
                    {
                      name: "search_products",
                      description: "Search for furniture and home decor products to buy",
                      parameters: {
                        type: "object",
                        properties: {
                          query: { type: "string" },
                          max_price: { type: "number", description: "Optional max price filter" }
                        },
                        required: ["query"]
                      }
                    },
                    {
                      name: "generate_room_preview",
                      description: "Generate a redesigned room image ONLY after confirming all design choices with the user.",
                      parameters: {
                        type: "object",
                        properties: {
                          style: { type: "string", description: "Overall design style e.g. 'Scandinavian', 'Modern Minimalist'" },
                          changes: {
                            type: "array",
                            items: { type: "string" },
                            description: "Every specific change agreed upon e.g. 'replace red bedspread with white linen', 'add a wooden floor lamp'"
                          },
                          color_palette: { type: "string", description: "e.g. 'warm beige walls, terracotta accents'" },
                          wall_color: { type: "string" },
                          ceiling: { type: "string", description: "e.g. 'keep white' or 'add wooden beams'" },
                          floor: { type: "string", description: "e.g. 'add jute rug' or 'keep dark wood'" },
                          lighting: { type: "string", description: "e.g. 'add warm pendant lamp, remove fluorescent'" },
                          keep: {
                            type: "array",
                            items: { type: "string" },
                            description: "Things to keep from the original room"
                          }
                        },
                        required: ["changes", "style", "color_palette"]
                      }
                    },
                    {
                      name: "create_shopping_list",
                      description: "Create a final shopping list of all items recommended during the session",
                      parameters: {
                        type: "object",
                        properties: {
                          items: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                estimated_price: { type: "string", description: "e.g. '$150' or '₹3,200'" },
                                reason: { type: "string", description: "Why this item was recommended" }
                              },
                              required: ["name", "estimated_price"]
                            }
                          },
                          total_budget: { type: "string", description: "Total estimated cost" }
                        },
                        required: ["items"]
                      }
                    }
                  ]
                }];
                data = JSON.stringify(msg);
                setupPatched = true;
                console.log("Injected transcription config and tools into setup");
              }
            } catch {}
          }
          return origSend(data);
        };

        return ws;
      } as any;
      // Copy static properties so SDK doesn't break
      (window.WebSocket as any).prototype = RealWebSocket.prototype;
      (window.WebSocket as any).CONNECTING = RealWebSocket.CONNECTING;
      (window.WebSocket as any).OPEN = RealWebSocket.OPEN;
      (window.WebSocket as any).CLOSING = RealWebSocket.CLOSING;
      (window.WebSocket as any).CLOSED = RealWebSocket.CLOSED;

      this.session = await this.client.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        } as any,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live: connected");
            this.isConnected = true;
            this.callbacks.onConnectionChange(true);
            this.callbacks.onTranscriptStream("agent", "Connected! Listening...");
          },
          onmessage: (msg: LiveServerMessage) => {
            // SDK callback — only used for audio playback (modelTurn.inlineData)
            this.handleSdkMessage(msg);
          },
          onerror: (err: ErrorEvent) => {
            console.error("Gemini Live error:", err);
            this.callbacks.onError(err.message || "Connection error");
          },
          onclose: (e: CloseEvent) => {
            console.log("Gemini Live: disconnected — code:", e.code);
            this.isConnected = false;
            this.isSpeaking = false;
            this.callbacks.onConnectionChange(false);
          },
        },
      });

      // Restore real WebSocket
      window.WebSocket = RealWebSocket;

      // Attach raw message listener on the REAL WebSocket for transcription
      if (capturedWs) {
        capturedWs.addEventListener("message", (event: MessageEvent) => {
          this.handleRawMessage(event);
        });
        console.log("Raw WS listener attached for transcription");
      }

      console.log("Session established, setup patched:", setupPatched);
      this.sendWelcome();
    } catch (err: any) {
      console.error("Failed to connect:", err);
      this.callbacks.onError(err.message || "Failed to connect to Gemini");
      throw err;
    }
  }

  /** Trigger the model to speak a welcome greeting */
  private sendWelcome() {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.conn.send(JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text: "Hey! I just joined. Say a quick welcome and tell me what you can help with — keep it to one sentence." }],
            },
          ],
          turnComplete: true,
        },
      }));
      console.log("Welcome prompt sent");
    } catch (e) {
      console.error("Welcome send error:", e);
    }
  }

  /** SDK message handler — plays audio only */
  private handleSdkMessage(msg: LiveServerMessage) {
    const sc = (msg as any).serverContent;
    if (!sc) return;

    if (sc.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.data) {
          this.isSpeaking = true;
          const audioData = this.base64ToArrayBuffer(part.inlineData.data);
          this.callbacks.onAudioOutput(audioData);
        }
      }
    }

    if (sc.turnComplete) {
      this.isSpeaking = false;
      this.currentAgentText = "";
      this.currentUserText = "";
      this.callbacks.onTurnComplete();
    }

    if (sc.interrupted) {
      this.isSpeaking = false;
      this.currentAgentText = "";
      this.callbacks.onInterrupted();
    }
  }

  /** Raw WS handler — reads transcription that the SDK strips */
  private async handleRawMessage(event: MessageEvent) {
    try {
      let data: any;
      if (event.data instanceof Blob) {
        data = JSON.parse(await event.data.text());
      } else if (typeof event.data === "string") {
        data = JSON.parse(event.data);
      } else {
        return;
      }

      this.rawMsgCount++;

      // Handle tool calls (outside serverContent)
      if (data.toolCall?.functionCalls) {
        for (const call of data.toolCall.functionCalls) {
          this.executeFunctionCall(call);
        }
        return;
      }

      const sc = data.serverContent;
      if (!sc) return;

      // Log all keys from raw serverContent to debug
      if (this.rawMsgCount <= 15 || this.rawMsgCount % 100 === 0) {
        console.log(`RAW #${this.rawMsgCount} sc keys:`, Object.keys(sc));
      }

      // Output transcription — agent's spoken words
      if (sc.outputTranscription?.text) {
        const text = sc.outputTranscription.text;
        if (text.trim()) {
          this.currentAgentText += text;
          this.callbacks.onTranscriptStream("agent", this.currentAgentText.trim());
        }
      }

      // Input transcription — user's spoken words
      if (sc.inputTranscription?.text) {
        const text = sc.inputTranscription.text;
        if (text.trim()) {
          this.currentUserText += text;
          this.callbacks.onTranscriptStream("user", this.currentUserText.trim());
        }
      }
    } catch {}
  }

  private audioCount = 0;
  sendAudio(base64Audio: string) {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.conn.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            { mimeType: "audio/pcm;rate=16000", data: base64Audio },
          ],
        },
      }));
      this.audioCount++;
      if (this.audioCount <= 5 || this.audioCount % 50 === 0) {
        console.log("Audio sent #" + this.audioCount, "size:", base64Audio.length);
      }
    } catch (e) {
      console.error("Audio send error:", e);
    }
  }

  sendImage(base64ImageData: string) {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.conn.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            { mimeType: "image/jpeg", data: base64ImageData },
          ],
        },
      }));
    } catch (_) {}
  }

  /**
   * Send an uploaded room photo as a proper clientContent turn so Gemini
   * treats it as a discrete user message (not a live camera frame).
   * Includes a text instruction so Gemini knows to analyze this specific image.
   */
  sendImageMessage(base64: string, mimeType: string = "image/jpeg") {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.conn.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: "I've uploaded a photo of my room (this is a static uploaded image, not the camera). Please analyze this room carefully: describe the current style, lighting, furniture layout, color palette, and any design issues you notice. Then ask me questions about my style preferences, how I use the space, and my budget so we can plan improvements together." }
            ]
          }],
          turnComplete: true,
        },
      }));
    } catch (e) {
      console.error("Image message send error:", e);
    }
  }

  private async executeFunctionCall(call: { id: string; name: string; args: any }) {
    // generate_room_preview — calls the preview API with the agreed changes
    if (call.name === "generate_room_preview") {
      const uploadedImage = this.callbacks.getUploadedImage?.();
      if (!uploadedImage) {
        const result = { error: "No room image uploaded. Please upload a photo of your room first." };
        this.callbacks.onToolResult?.(call.name, result);
        this.session.conn.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, response: { output: result } }] }
        }));
        return;
      }

      // Notify UI that preview is generating
      this.callbacks.onToolResult?.(call.name, { generating: true, args: call.args });

      // Send ack to Gemini immediately so it can keep talking
      this.session.conn.send(JSON.stringify({
        toolResponse: { functionResponses: [{ id: call.id, response: { output: { status: "generating", message: "Generating your redesigned room preview, this takes about 10-15 seconds..." } } }] }
      }));

      // Call preview API in background
      fetch("/api/room/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.mimeType,
          changes: call.args.changes ?? [],
          style: call.args.style ?? "",
          colorPalette: call.args.color_palette ?? "",
          wall_color: call.args.wall_color ?? "",
          ceiling: call.args.ceiling ?? "",
          floor: call.args.floor ?? "",
          lighting: call.args.lighting ?? "",
          keep: call.args.keep ?? [],
        }),
      })
        .then((r) => r.json())
        .then((data) => this.callbacks.onToolResult?.("generate_room_preview_done", data))
        .catch(() => this.callbacks.onToolResult?.("generate_room_preview_done", { error: "Preview generation failed" }));
      return;
    }

    // create_shopping_list is handled client-side — no API call needed
    if (call.name === "create_shopping_list") {
      const result = { success: true, message: "Shopping list created" };
      this.callbacks.onToolResult?.(call.name, call.args);
      try {
        this.session.conn.send(JSON.stringify({
          toolResponse: {
            functionResponses: [{ id: call.id, response: { output: result } }],
          },
        }));
      } catch (e) {
        console.error("Failed to send tool response:", e);
      }
      return;
    }

    let result: any = {};
    try {
      const endpoint =
        call.name === "search_references"
          ? "/api/references/search"
          : "/api/products/search";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(call.args),
      });
      result = await res.json();
    } catch (e) {
      result = { error: "Search failed" };
    }

    // Notify UI
    this.callbacks.onToolResult?.(call.name, result);

    // Send tool_response back to Gemini
    const responseMsg = JSON.stringify({
      toolResponse: {
        functionResponses: [{ id: call.id, response: { output: result } }],
      },
    });
    try {
      this.session.conn.send(responseMsg);
    } catch (e) {
      console.error("Failed to send tool response:", e);
    }
  }

  sendText(text: string) {
    if (!this.session || !this.isConnected) return;
    try {
      this.session.conn.send(JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        },
      }));
    } catch (e) {
      console.error("Text send error:", e);
    }
  }

  disconnect() {
    if (this.session) {
      try { this.session.close(); } catch (_) {}
      this.session = null;
      this.isConnected = false;
      this.isSpeaking = false;
      this.callbacks.onConnectionChange(false);
    }
  }

  getIsConnected() {
    return this.isConnected;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
