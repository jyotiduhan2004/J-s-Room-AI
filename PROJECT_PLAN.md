# RoomGenie — Live AI Interior Designer

## Hackathon
**Gemini Live Agent Challenge** — Devpost
- Category: **Live Agents**
- Deadline: March 17, 2026
- Prize Pool: $80,000

---

## Problem Statement

Redesigning a room is expensive, confusing, and inaccessible for most people:

1. **Hiring an interior designer** — costs ₹50K-5L+, weeks of back-and-forth, out of reach for most households
2. **DIY approach** — browse Pinterest for hours, no idea if it'll work in YOUR room, buy wrong products, waste money
3. **Online design tools** — require uploading photos, dragging elements, learning a UI. Not natural.
4. **No way to visualize changes** — "Will sage green look good on THIS wall?" — you just have to guess and hope

**The core frustration**: People know what vibe they want ("modern", "cozy", "Scandinavian") but can't bridge the gap between inspiration and their actual room. And there's no one affordable to guide them through it.

---

## Solution: RoomGenie

A **live voice + vision AI interior designer** that sees your room through your camera, has a real-time conversation with you about redesigning it, shows you reference images, generates an improved version, and gives you a shopping list with actual purchase links — all in one live conversation.

### The Flow:

**Step 1 — Room Analysis**
User opens web app → points camera at room → Agent analyzes it in real-time
> Agent: "I can see your living room. The walls are plain white, there's a brown sofa against the wall, and the lighting is quite harsh with that overhead tube light. A few things I'd suggest improving..."

**Step 2 — Gap Identification & Suggestions**
Agent identifies design gaps and suggests improvements via voice
> Agent: "Your room lacks warm lighting, the furniture is pushed against walls creating dead space in the center, and there's no accent color. I'd recommend adding a floor lamp, pulling the sofa forward, and adding an accent wall."

**Step 3 — Style Selection with Reference Images**
User asks for a theme → Agent searches the web and shows real reference images
> User: "Make it Scandinavian"
> Agent: "Great choice! Here are 3 Scandinavian living room designs I found. Which vibe do you prefer — the minimal one, the cozy one with wooden accents, or the bright one with plants?"

**Step 4 — Conversational Refinement**
User and agent go back and forth refining the design
> User: "I like the cozy one, but can the wall be warmer? And keep my budget under 20K"
> Agent: "Sure! A warm beige accent wall would work perfectly with the wooden theme. Let me adjust the suggestions to fit ₹20K..."

**Step 5 — Design Confirmation**
Agent confirms all suggested changes with the user before proceeding
> Agent: "So here's what we're going with — beige accent wall, a wooden floor lamp, two throw cushions in mustard, and a small indoor plant. Does that sound right?"

**Step 6 — Redesigned Room Image (Bonus)**
Agent generates an AI image of the redesigned room (if quality is good)
> Agent: "Here's a visualization of how your room could look with these changes"
- If image quality is good → show it
- If not → skip, the flow still works perfectly without it

**Step 7 — Shopping List with Purchase Links**
Agent generates a complete shopping list with real product links and prices
> Agent: "Here's everything you need:
> - Floor lamp — ₹3,200 [Amazon link]
> - Accent wall paint (Warm Beige) — ₹1,800 [Asian Paints link]
> - Throw cushions (2x) — ₹1,400 [Flipkart link]
> - Indoor plant (Snake Plant) — ₹600 [Nursery Live link]
> - Total: ₹7,000 — well within your ₹20K budget!"

### Key Differentiators:
- **Not a chatbot** — it's a live voice call with vision. Like FaceTiming an interior designer.
- **Sees YOUR actual room** — suggestions are specific to your space, not generic
- **Conversational refinement** — keep talking until you're happy with the design
- **Style presets** — "Scandinavian", "Gaming Room", "Bohemian", "Japanese Zen", "Industrial" — one word transforms everything
- **Real reference images from web** — not AI-generated mood boards, actual photos
- **Shopping list with real purchase links** — from inspiration to purchase in one conversation
- **Budget-aware** — respects your budget constraints
- **Multilingual** — Hindi, English, Hinglish
- **No app install** — works in phone browser

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  User's Phone/Laptop                     │
│           (Browser: mic + camera access)                 │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket (audio + video frames)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Backend (Cloud Run)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Gemini Live API                        │  │
│  │   - Real-time bidirectional voice I/O              │  │
│  │   - Vision understanding (camera frames)           │  │
│  │   - Interruption handling                          │  │
│  │   - Function calling (triggers tools below)        │  │
│  └──────────────────┬─────────────────────────────────┘  │
│                     │ Function Calls                      │
│  ┌──────────────────▼─────────────────────────────────┐  │
│  │           Agent Orchestrator (ADK)                  │  │
│  │                                                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │  │
│  │  │  Room       │ │  Style      │ │  Shopping    │  │  │
│  │  │  Analyzer   │ │  Curator    │ │  Agent       │  │  │
│  │  │             │ │             │ │              │  │  │
│  │  │  Analyzes   │ │  Searches   │ │  Searches    │  │  │
│  │  │  room from  │ │  web for    │ │  Amazon,     │  │  │
│  │  │  camera,    │ │  reference  │ │  Flipkart    │  │  │
│  │  │  identifies │ │  images,    │ │  for real     │  │  │
│  │  │  gaps &     │ │  mood       │ │  products,   │  │  │
│  │  │  suggests   │ │  boards,    │ │  compares    │  │  │
│  │  │  improve-   │ │  style      │ │  prices,     │  │  │
│  │  │  ments      │ │  matching   │ │  generates   │  │  │
│  │  │             │ │             │ │  buy links   │  │  │
│  │  └─────────────┘ └─────────────┘ └──────────────┘  │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Image Generator (Bonus)                     │   │  │
│  │  │  Gemini Imagen / native image gen            │   │  │
│  │  │  Generates redesigned room visualization     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Firestore                                        │    │
│  │  - Style presets database                         │    │
│  │  - Conversation logs                              │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React / Next.js (web app with mic + camera) |
| Voice + Vision | **Gemini Live API** (real-time bidirectional) |
| Agent Framework | **Google ADK** (Agent Development Kit) |
| SDK | **Google GenAI SDK** |
| Function Calling | Gemini function calling (search, products, image gen) |
| Image Generation | **Gemini Imagen** (bonus feature) |
| Web Search | **Google Search grounding** via function calling |
| Product Search | **Google Shopping API / SerpAPI** via function calling |
| Backend | Python (FastAPI) on **Google Cloud Run** |
| Database | **Firestore** (style presets + conversation logs) |
| Hosting | **Google Cloud Platform** |

---

## Function Calls (The Technical Differentiator)

These are the tools the agent calls MID-CONVERSATION:

```python
# 1. Analyze room from camera frame
analyze_room(image_frame) → {gaps, current_style, furniture, colors, lighting}

# 2. Search reference images for a style
search_style_references(style="scandinavian", room_type="living room") → [image_urls]

# 3. Search products with budget filter
search_products(item="floor lamp", style="scandinavian", max_price=5000) → [
  {name, price, image, buy_link, platform}
]

# 4. Generate shopping list
generate_shopping_list(items, budget) → {
  items: [{name, price, link}],
  total, savings_tips
}

# 5. Generate redesigned room image (bonus)
generate_room_image(current_room_description, changes) → image_url
```

Each function call = a visible "wow" moment in the demo. The agent isn't just talking — it's DOING things.

---

## Hackathon Requirements Checklist

| Requirement | Status |
|---|---|
| Leverages a Gemini model | ✅ Gemini via Live API + Imagen |
| Uses GenAI SDK or ADK | ✅ ADK for multi-agent orchestration |
| At least one Google Cloud service | ✅ Cloud Run + Firestore |
| Multimodal (not just text-in/text-out) | ✅ Voice + Camera + Images + Shopping links |
| Live Agent category fit | ✅ Real-time, interruptible voice + vision |
| Google Cloud deployment proof | ✅ Cloud Run deployment recording |
| Architecture diagram | ✅ Included above |
| Public code repo | ✅ GitHub |
| Demo video < 4 min | ✅ Planned |
| Spin-up instructions in README | ✅ Planned |

---

## Demo Script (3-4 minutes)

### Scene 1: The Problem (20 sec)
- Quick montage: person scrolling Pinterest endlessly, confused at a paint store, measuring furniture wrong
- Text overlay: "Redesigning your room shouldn't cost ₹50,000 or take 50 hours"
- "What if you could just SHOW your room and TALK to a designer?"

### Scene 2: Room Analysis (40 sec)
- Open RoomGenie on phone → point camera at a real room
- Agent: "I can see your living room. The walls are plain white, the sofa is pushed against the wall, and the lighting is quite harsh. Here's what I'd improve..."
- Agent lists 3-4 specific gaps it identified

### Scene 3: Style Selection (40 sec)
- User: "I want a Scandinavian look"
- Agent: "Great choice! Let me find some references..."
- → Function call fires → 3 real Scandinavian room photos appear on screen
- Agent: "Which of these vibes do you prefer?"
- User: "The second one, but warmer"

### Scene 4: Conversational Refinement (30 sec)
- Agent: "How about a warm beige accent wall with wooden furniture?"
- User: "Yes! But keep it under ₹15K"
- Agent: "Absolutely. Let me adjust..."
- Shows back-and-forth natural conversation with interruptions

### Scene 5: Generated Image (20 sec) [Bonus]
- Agent: "Here's a visualization of your redesigned room"
- Shows AI-generated image (if quality is good)
- Or shows a mood board collage of reference images

### Scene 6: Shopping List (30 sec)
- Agent: "Here's everything you need to make this happen"
- → Function call fires → Shopping list appears with:
  - Product images
  - Prices
  - Direct buy links (Amazon, Flipkart, etc.)
  - Total: ₹12,500 — under budget!
- "Click any item to buy it right now"

### Scene 7: Tech Walkthrough (20 sec)
- Quick architecture diagram
- Show Google Cloud Run deployment
- "Built with Gemini Live API + ADK on Google Cloud"

---

## Judging Criteria Alignment

### Innovation & Multimodal User Experience (40%)
- **Breaks the text box completely** — zero typing, pure voice + camera interaction
- **5 modalities in one flow**: Voice → Camera → Web images → AI-generated image → Shopping links
- **See + Hear + Speak** — agent uses all multimodal capabilities simultaneously
- **Natural conversation** with interruptions — "wait, that's too expensive" → agent adapts
- **Distinct persona** — friendly, knowledgeable interior designer
- **Context-aware** — sees YOUR room, not generic suggestions
- **Style presets** — one word transforms the entire design direction

### Technical Implementation & Agent Architecture (30%)
- **Gemini Live API** for real-time bidirectional audio + video streaming
- **ADK** for multi-agent orchestration (Room Analyzer, Style Curator, Shopping Agent)
- **Function calling** — 5 distinct tools called mid-conversation
- **Google Search grounding** — real reference images, reduces hallucination
- **Hosted on Google Cloud** (Cloud Run + Firestore)
- Clean code, modular architecture, proper error handling

### Demo & Presentation (30%)
- **Clear problem** — everyone has redesigned or wanted to redesign a room
- **Live working software** — no mockups, real camera, real conversation
- **Progressive wow moments** — each step adds something new
- **Architecture diagram** included
- **Google Cloud deployment proof** included
- **Shopping links** = tangible output judges can click

---

## Style Presets

| Preset | Key Elements |
|---|---|
| Scandinavian | White/beige walls, wooden furniture, minimal decor, natural light |
| Industrial | Exposed brick, metal fixtures, dark tones, Edison bulbs |
| Bohemian | Rich colors, textured fabrics, plants, eclectic art |
| Japanese Zen | Clean lines, natural materials, neutral palette, minimal |
| Gaming Room | RGB lighting, desk setup, monitor stand, dark theme |
| Modern Minimalist | Clean lines, neutral colors, few but impactful pieces |
| Rustic Farmhouse | Warm wood, vintage elements, earth tones, cozy textiles |
| Art Deco | Bold geometric patterns, metallic accents, luxe materials |

---

## 5-Day Build Plan

| Day | Task | Deliverable |
|---|---|---|
| **Day 1** | Set up project: React frontend with camera + mic access. Connect to Gemini Live API. Basic voice conversation working. | Can talk to Gemini and share camera feed |
| **Day 2** | Build Room Analyzer: agent analyzes camera frames, identifies furniture/colors/gaps. Add ADK agent structure. | Agent can see a room and describe what it sees + suggest improvements |
| **Day 3** | Add function calling: web search for reference images + style presets. Style selection flow working. | User says "Scandinavian" → agent shows real reference photos |
| **Day 4** | Shopping Agent: product search with buy links + budget filtering. Image generation (bonus). End-to-end flow. | Complete flow from room analysis → shopping list with links |
| **Day 5** | Deploy to Cloud Run. Record demo video (3-4 min). Write README with setup instructions. Submit. | Final submission on Devpost |

---

## Target Audience & Impact

- **Young professionals** — moving into new apartments, want aesthetic rooms on a budget
- **Homeowners** — want to refresh their space without hiring expensive designers
- **Renters** — need affordable, reversible design changes
- **Students** — decorating dorm rooms / PG rooms
- **Small business owners** — designing shop/office interiors affordably
- **Anyone on a budget** — the shopping list respects budget constraints

**Impact**: Democratizes interior design. Professional-quality design advice + shopping guidance, accessible to anyone with a phone and a room to redesign. No ₹50K designer fees. No hours on Pinterest. Just show your room, talk about what you want, and get actionable results with purchase links.

---

## Bonus Points Opportunities

### Content Creation
Publish a blog/video covering how RoomGenie was built with Gemini Live API and Google Cloud.
- Include #GeminiLiveAgentChallenge hashtag
- Cover: problem, solution, technical architecture, demo

### Automated Cloud Deployment
Include deployment scripts in the repo:
- Dockerfile + Cloud Run deployment script
- Infrastructure-as-code (Terraform or gcloud CLI)

### Google Developer Group
Sign up for GDG and link public profile in submission.

---

## Project Name Options
- **RoomGenie** — "Your room's design genie"
- **DecorAI** — "AI-powered decor assistant"
- **StyleSight** — "See your style come to life"
- **ReRoom** — "Re-imagine your room"

---

## Code Reuse for Amazon Nova Hackathon

~80-90% of this codebase can be reused for the Amazon Nova hackathon by swapping:
- Gemini Live API → Nova 2 Sonic (voice) + Nova 2 Lite (reasoning + vision)
- ADK → Strands Agents
- Google Cloud → AWS (ECS + DynamoDB)
- Google Search → Amazon product search
- Firestore → DynamoDB

Same frontend, same conversation flow, same function calling logic, same shopping list feature.
