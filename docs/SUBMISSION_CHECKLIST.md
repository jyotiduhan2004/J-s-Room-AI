# J's Room AI — Submission Checklist

## Devpost Submission Requirements

### Required Fields

- [ ] **Project name**: J's Room AI
- [ ] **Tagline**: Live AI interior designer — show your room, talk about your style, get a shopping list
- [ ] **Category**: Live Agents
- [ ] **About the project**: Problem, solution, how it works, what's next
- [ ] **Built with**: Gemini Live API, Google GenAI SDK, Google Cloud Run, Firestore, Next.js, SerpAPI, Unsplash API
- [ ] **Demo video**: < 4 minutes (see plan below)
- [ ] **Public GitHub repo**: Link to repo with README
- [ ] **Try it out**: Live URL (Cloud Run deployment)

### Hackathon Technical Requirements

| Requirement | How We Meet It | Status |
|---|---|---|
| Leverages a Gemini model | gemini-2.0-flash-exp via Live API + Gemini 2.5 Flash for image gen | [ ] |
| Uses GenAI SDK or ADK | @google/genai SDK for Live API connection | [ ] |
| At least one Google Cloud service | Cloud Run (backend) + Firestore (storage) | [ ] |
| Multimodal (not text-in/text-out) | Voice input + camera vision + image output + shopping links | [ ] |
| Architecture diagram | In ARCHITECTURE.md + shown in demo video | [ ] |
| Public code repo | GitHub (public) | [ ] |
| Spin-up instructions in README | Docker + env vars + deploy script | [ ] |
| Cloud deployment proof | Cloud Run URL + shown in demo video | [ ] |

---

## Demo Video Plan (3–4 minutes)

### Scene 1: The Problem (20 sec)
- Screen recording: person scrolling Pinterest endlessly
- Text overlay: "Redesigning your room shouldn't be this hard"
- Quick cuts showing the frustration of DIY interior design

### Scene 2: Intro (10 sec)
- J's Room AI logo/title
- "Your live AI interior designer"
- "Show your room. Talk about your style. Get a shopping list."

### Scene 3: Room Analysis — LIVE (40 sec)
- Open J's Room AI on phone/laptop
- Point camera at a real room
- Agent speaks: analyzes the room, identifies gaps
- Show the agent seeing specific things (wall color, furniture, lighting)

### Scene 4: Style Selection + References (40 sec)
- User says: "I want a Scandinavian look"
- Agent calls `search_references` tool
- Reference images appear in the UI
- Agent: "Which of these vibes do you prefer?"
- User picks one, asks for changes

### Scene 5: Conversational Refinement (30 sec)
- Back-and-forth with the agent
- User sets budget: "Keep it under ₹15K"
- Agent adapts suggestions
- Show natural interruption handling

### Scene 6: Generated Room Image (15 sec) — Bonus
- Agent generates a redesigned room visualization
- Image appears in UI
- (If quality is poor, skip this scene)

### Scene 7: Shopping List (30 sec)
- Agent calls `search_products` / `create_shopping_list`
- Shopping list appears: product images, prices, buy links
- Total shown with budget comparison
- "Click any item to buy it right now"

### Scene 8: Tech Architecture (15 sec)
- Show architecture diagram
- Highlight: Gemini Live API, GenAI SDK, Cloud Run, Firestore
- Show Cloud Run deployment in GCP console

### Scene 9: Closing (10 sec)
- "J's Room AI — professional interior design advice for everyone"
- Built with Gemini Live API + Google Cloud
- GitHub link

**Total: ~3.5 minutes**

### Video Recording Tips
- Use OBS or screen recording tool
- Record the live session in one take if possible (shows it's real)
- Have a well-lit room ready for the demo
- Test audio levels before recording
- Have a backup recording in case of API issues

---

## Bonus Points Tasks

### 1. Content Creation (Blog/Video)
- [ ] Write a blog post or create a video about building J's Room AI
- [ ] Cover: problem → solution → architecture → demo
- [ ] Include `#GeminiLiveAgentChallenge` hashtag
- [ ] Publish on: Medium, Dev.to, YouTube, or LinkedIn
- [ ] Link in Devpost submission

### 2. Automated Cloud Deployment
- [ ] `Dockerfile` in repo for backend
- [ ] `deploy.sh` script with gcloud CLI commands
- [ ] `cloudbuild.yaml` or equivalent CI/CD config
- [ ] Document in README: one-command deploy

### 3. Google Developer Group
- [ ] Sign up at [developers.google.com/community/gdg](https://developers.google.com/community/gdg)
- [ ] Make profile public
- [ ] Link in Devpost submission

---

## Judging Criteria Alignment

### Innovation & Multimodal UX (40%)
- [x] Not a chatbot — live voice + vision
- [x] 5 modalities: voice → camera → web images → AI image → shopping links
- [x] Natural conversation with interruptions
- [x] Context-aware (sees YOUR room)
- [x] Distinct persona (interior designer)
- [x] Style presets (one word transforms design direction)

### Technical Implementation (30%)
- [x] Gemini Live API (real-time bidirectional)
- [x] Function calling (4 tools called mid-conversation)
- [x] GenAI SDK (official)
- [x] Google Cloud (Cloud Run + Firestore)
- [x] Context compression (extends session length)
- [x] Clean architecture (frontend ↔ Gemini, frontend ↔ backend)

### Demo & Presentation (30%)
- [x] Clear, relatable problem
- [x] Live working software (not mockups)
- [x] Progressive wow moments (each step adds something)
- [x] Architecture diagram
- [x] Cloud deployment proof
- [x] Tangible output (shopping list with clickable links)

---

## Pre-Submission Checklist (Day 6)

### Code
- [ ] All API keys removed from code (use env vars)
- [ ] `.env.example` file with all required vars
- [ ] `README.md` with setup + run instructions
- [ ] Code is clean, no debug logs
- [ ] Repo is public on GitHub

### Deployment
- [ ] Backend running on Cloud Run
- [ ] Frontend accessible via URL
- [ ] All features working on deployed version
- [ ] CORS configured correctly

### Devpost
- [ ] All required fields filled
- [ ] Video uploaded or linked
- [ ] GitHub repo linked
- [ ] Live URL provided
- [ ] Category set to "Live Agents"
- [ ] "Built with" technologies listed
- [ ] Bonus tasks linked (if completed)

### Final Test
- [ ] Full flow works: camera → analysis → style → references → products → shopping list
- [ ] Works on mobile browser (Chrome)
- [ ] Works on desktop browser
- [ ] Voice is clear and natural
- [ ] Function calls execute within ~3 seconds
- [ ] No crashes during a 5-minute session
