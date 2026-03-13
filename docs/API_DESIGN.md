# J's Room AI — API Design

## Cloud Run Backend Endpoints

Base URL: `https://jsroomai-backend-XXXXX.run.app`

---

### POST /api/products/search

Search Google Shopping via SerpAPI for purchasable products.

**Request:**
```json
{
  "query": "scandinavian floor lamp",
  "max_price": 5000,
  "currency": "INR",
  "num_results": 5
}
```

**Response:**
```json
{
  "products": [
    {
      "title": "Wooden Tripod Floor Lamp - Scandinavian Style",
      "price": 3299,
      "currency": "INR",
      "source": "Amazon.in",
      "link": "https://www.amazon.in/dp/B0XXXXXX",
      "thumbnail": "https://...",
      "rating": 4.2,
      "reviews": 156
    }
  ],
  "query": "scandinavian floor lamp",
  "total_results": 5
}
```

**Implementation:**
```python
@app.post("/api/products/search")
async def search_products(req: ProductSearchRequest):
    params = {
        "engine": "google_shopping",
        "q": req.query,
        "api_key": SERPAPI_KEY,
        "gl": "in",  # India
        "hl": "en",
    }
    results = GoogleSearch(params).get_dict()
    products = []
    for item in results.get("shopping_results", [])[:req.num_results]:
        price = parse_price(item.get("price", ""))
        if req.max_price and price > req.max_price:
            continue
        products.append({
            "title": item.get("title"),
            "price": price,
            "currency": req.currency,
            "source": item.get("source"),
            "link": item.get("link"),
            "thumbnail": item.get("thumbnail"),
            "rating": item.get("rating"),
            "reviews": item.get("reviews"),
        })
    return {"products": products, "query": req.query, "total_results": len(products)}
```

---

### POST /api/references/search

Search Unsplash for interior design reference images.

**Request:**
```json
{
  "query": "scandinavian living room interior",
  "num_results": 6
}
```

**Response:**
```json
{
  "images": [
    {
      "id": "abc123",
      "url_small": "https://images.unsplash.com/photo-xxx?w=400",
      "url_regular": "https://images.unsplash.com/photo-xxx?w=1080",
      "alt": "Minimalist Scandinavian living room with wooden furniture",
      "photographer": "Jane Doe",
      "photographer_url": "https://unsplash.com/@janedoe"
    }
  ],
  "query": "scandinavian living room interior",
  "total_results": 6
}
```

**Implementation:**
```python
@app.post("/api/references/search")
async def search_references(req: ReferenceSearchRequest):
    resp = requests.get("https://api.unsplash.com/search/photos", params={
        "query": req.query,
        "per_page": req.num_results,
        "orientation": "landscape",
    }, headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"})
    data = resp.json()
    images = []
    for photo in data.get("results", []):
        images.append({
            "id": photo["id"],
            "url_small": photo["urls"]["small"],
            "url_regular": photo["urls"]["regular"],
            "alt": photo.get("alt_description", ""),
            "photographer": photo["user"]["name"],
            "photographer_url": photo["user"]["links"]["html"],
        })
    return {"images": images, "query": req.query, "total_results": len(images)}
```

---

### POST /api/image/generate

Generate a redesigned room image using Gemini 2.5 Flash (bonus feature).

**Request:**
```json
{
  "prompt": "A cozy Scandinavian living room with warm beige walls, a light grey sofa with mustard throw pillows, a wooden tripod floor lamp, and a snake plant in the corner. Natural light from a large window. Photorealistic interior design photo.",
  "aspect_ratio": "16:9"
}
```

**Response:**
```json
{
  "image_url": "data:image/png;base64,...",
  "prompt_used": "..."
}
```

---

### POST /api/session/save

Save session data (shopping list, conversation summary) to Firestore.

**Request:**
```json
{
  "session_id": "uuid-here",
  "room_analysis": { "gaps": [...], "style": "..." },
  "shopping_list": {
    "items": [...],
    "total": 12500,
    "budget": 20000
  },
  "style_chosen": "scandinavian",
  "created_at": "2026-03-15T10:30:00Z"
}
```

**Response:**
```json
{
  "session_id": "uuid-here",
  "status": "saved"
}
```

---

### GET /api/session/:id

Retrieve a saved session.

**Response:** Same shape as the save request body.

---

## Gemini Live API — Tool Declarations

These tools are declared when establishing the WebSocket connection, so Gemini can call them mid-conversation.

### Connection Config

```javascript
const session = await client.live.connect({
  model: "gemini-2.0-flash-exp",
  config: {
    responseModalities: ["AUDIO"],
    systemInstruction: SYSTEM_PROMPT,
    contextWindowCompression: {
      triggerTokens: 25000,
      slidingWindow: {
        targetTokens: 12500,
      },
    },
    tools: [
      {
        functionDeclarations: [
          SEARCH_REFERENCES_TOOL,
          SEARCH_PRODUCTS_TOOL,
          CREATE_SHOPPING_LIST_TOOL,
          GENERATE_ROOM_IMAGE_TOOL,
        ],
      },
    ],
  },
});
```

### Tool: search_references

```javascript
const SEARCH_REFERENCES_TOOL = {
  name: "search_references",
  description:
    "Search for interior design reference images matching a style or theme. Call this when the user asks to see examples of a style, or when you want to show them inspiration images.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search query for reference images, e.g. 'scandinavian living room' or 'industrial bedroom with warm lighting'",
      },
      num_results: {
        type: "number",
        description: "Number of images to return (default 4, max 6)",
      },
    },
    required: ["query"],
  },
};
```

### Tool: search_products

```javascript
const SEARCH_PRODUCTS_TOOL = {
  name: "search_products",
  description:
    "Search for purchasable products on Google Shopping. Call this when recommending specific items the user should buy, like furniture, decor, paint, lighting, etc.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Product search query, e.g. 'wooden tripod floor lamp' or 'mustard throw cushion covers'",
      },
      max_price: {
        type: "number",
        description: "Maximum price in INR. Omit if no budget constraint.",
      },
      num_results: {
        type: "number",
        description: "Number of products to return (default 3, max 5)",
      },
    },
    required: ["query"],
  },
};
```

### Tool: create_shopping_list

```javascript
const CREATE_SHOPPING_LIST_TOOL = {
  name: "create_shopping_list",
  description:
    "Compile a final shopping list of all recommended items with prices and buy links. Call this when the user is ready to see everything they need to buy.",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            query: { type: "string", description: "Search query to find this product" },
            max_price: { type: "number" },
          },
          required: ["name", "query"],
        },
        description: "List of items to search for and compile into a shopping list",
      },
      budget: {
        type: "number",
        description: "Total budget in INR",
      },
    },
    required: ["items"],
  },
};
```

### Tool: generate_room_image

```javascript
const GENERATE_ROOM_IMAGE_TOOL = {
  name: "generate_room_image",
  description:
    "Generate an AI visualization of the redesigned room. Call this after finalizing the design with the user, to show them what the room could look like.",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description:
          "Detailed description of the redesigned room for image generation. Include style, colors, furniture, lighting, and layout details.",
      },
    },
    required: ["prompt"],
  },
};
```

### Function Call Handling (Client-Side)

```javascript
session.on("message", async (msg) => {
  // Handle tool calls
  if (msg.toolCall) {
    const results = [];
    for (const call of msg.toolCall.functionCalls) {
      let result;
      switch (call.name) {
        case "search_references":
          result = await fetch(`${BACKEND_URL}/api/references/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          }).then((r) => r.json());
          // Also update UI
          setReferenceImages(result.images);
          break;

        case "search_products":
          result = await fetch(`${BACKEND_URL}/api/products/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          }).then((r) => r.json());
          setProductResults(result.products);
          break;

        case "create_shopping_list":
          // Search for each item and compile
          result = await fetch(`${BACKEND_URL}/api/products/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: call.args.items, budget: call.args.budget }),
          }).then((r) => r.json());
          setShoppingList(result);
          break;

        case "generate_room_image":
          result = await fetch(`${BACKEND_URL}/api/image/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          }).then((r) => r.json());
          setGeneratedImage(result.image_url);
          break;
      }

      results.push({
        id: call.id,
        name: call.name,
        response: result,
      });
    }

    // Send results back to Gemini
    session.send({ toolResponse: { functionResponses: results } });
  }
});
```

## External API Integration Summary

| API | Endpoint | Auth | Rate Limit |
|---|---|---|---|
| SerpAPI | `serpapi.com/search?engine=google_shopping` | `api_key` param | 250/month (free) |
| Unsplash | `api.unsplash.com/search/photos` | `Authorization: Client-ID xxx` header | 50 req/hr (demo) |
| Gemini Live | WebSocket via @google/genai SDK | API key in SDK init | Per-model limits |
| Gemini 2.5 Flash | `generativelanguage.googleapis.com` via SDK | API key in SDK init | Per-model limits |
| Firestore | `firebase.google.com` via SDK | Service account (auto on Cloud Run) | 50K reads/day (free) |
