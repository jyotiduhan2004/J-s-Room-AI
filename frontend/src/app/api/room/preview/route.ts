import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const {
    imageBase64,
    mimeType = "image/jpeg",
    changes = [] as string[],
    style = "",
    colorPalette = "",
    wall_color = "",
    ceiling = "",
    floor = "",
    lighting = "",
    keep = [] as string[],
    styleContext = "",
  } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const hasStructuredChanges = changes.length > 0;

  const visionPrompt = hasStructuredChanges
    ? `You are an interior design expert and image prompt writer.

STEP 1 — ROOM INVENTORY (do this first):
Look at the photo and list every visible object with its exact position:
- Each piece of furniture (chairs, desks, tables, beds, sofas) — where exactly in the room
- Fixed elements (windows, doors, AC, TV) — which wall
- Decor (posters, plants, shelves) — where
- Current colors, materials, flooring, ceiling

STEP 2 — Write ONE image generation prompt (5-7 sentences) showing this EXACT room with only these changes:

CHANGES:
${changes.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}
${style ? `\nSTYLE: ${style}` : ""}
${colorPalette ? `\nCOLOR PALETTE: ${colorPalette}` : ""}
${wall_color ? `\nWALL COLOR: ${wall_color}` : ""}
${ceiling ? `\nCEILING: ${ceiling}` : ""}
${floor ? `\nFLOOR: ${floor}` : ""}
${lighting ? `\nLIGHTING: ${lighting}` : ""}
${keep.length > 0 ? `\nMUST KEEP in exact same position and appearance: ${keep.join(", ")}` : ""}

RULES:
1. Same camera angle, perspective, room shape, and dimensions
2. Every item from STEP 1 inventory MUST appear in the prompt at its original position — unless it's explicitly in CHANGES
3. Items in the KEEP list must be described exactly as they appear ("the existing black office chairs in the same positions")
4. Only apply the listed CHANGES — nothing else moves, disappears, or gets replaced
5. Name each change explicitly (e.g. "light wood flooring replacing the current dark tiles")
6. End with: "Photorealistic interior, same room layout and camera angle as the reference, high resolution, natural lighting"

Write ONLY the prompt. Start with "The same [room type] from the reference photo, redesigned..."`
    : `You are an interior design expert. Analyze this room photo.

First inventory every visible object and its position. Then write a detailed image generation prompt (5-7 sentences) showing it redesigned in ${style || styleContext || "modern minimalist"} style.

Every piece of furniture must stay in its exact original position. Only change colors, materials, and decor.
Include: room type, every visible furniture piece described in its position, new color scheme (${colorPalette || "warm neutrals"}), materials, lighting, decor.
End with: "Photorealistic interior, same room layout and camera angle as the reference, high resolution, natural lighting"
Write ONLY the prompt. Start with "The same [room type] from the reference photo, redesigned..."`;

  try {
    // Step 1: Gemini 2.5 Flash analyzes room + builds targeted image prompt
    const visionRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: visionPrompt }
        ]
      }],
    });

    const imagePrompt = visionRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!imagePrompt) {
      return NextResponse.json({ error: "Could not generate room description" }, { status: 500 });
    }

    console.log("Image prompt:", imagePrompt);

    // Step 2: Imagen 4 generates the redesigned room
    const imagenRes = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: imagePrompt,
      config: { numberOfImages: 1, aspectRatio: "16:9" },
    });

    const generatedImage = imagenRes.generatedImages?.[0]?.image?.imageBytes;
    if (!generatedImage) {
      return NextResponse.json({ error: "Image generation returned no output" }, { status: 500 });
    }

    return NextResponse.json({
      imageBase64: generatedImage,
      mimeType: "image/png",
      prompt: imagePrompt,
      changes,
      style,
    });

  } catch (err: any) {
    console.error("Room preview error:", err);
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}
