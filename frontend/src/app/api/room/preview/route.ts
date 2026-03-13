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

Analyze this room photo carefully. First, identify and note:
- Exact room layout and camera angle/perspective
- Position of EVERY fixed element: window (which wall, which side), door, AC unit, TV, bed, desk with PC, wardrobe, posters, any built-in features
- Current wall color, floor type, ceiling

Now write a SINGLE detailed image generation prompt (5-7 sentences) showing this EXACT SAME room redesigned with ONLY the following changes:

CHANGES TO APPLY:
${changes.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}
${style ? `\nSTYLE: ${style}` : ""}
${colorPalette ? `\nCOLOR PALETTE: ${colorPalette}` : ""}
${wall_color ? `\nWALL COLOR: ${wall_color}` : ""}
${ceiling ? `\nCEILING: ${ceiling}` : ""}
${floor ? `\nFLOOR: ${floor}` : ""}
${lighting ? `\nLIGHTING: ${lighting}` : ""}
${keep.length > 0 ? `\nKEEP EXACTLY AS-IS (do not move or remove): ${keep.join(", ")}` : ""}

CRITICAL RULES — failure to follow = wrong output:
1. IDENTICAL camera angle, perspective, and room geometry as the original photo
2. Window stays on the SAME wall and SAME side as in the photo
3. Bed, desk, AC, TV, wardrobe stay in EXACT same positions — do NOT rearrange furniture
4. Only change: colors, fabrics, textures, decorative accessories, lighting fixtures
5. Describe every fixed element explicitly in its original position (e.g. "AC unit on the right wall, TV mounted on the left wall")
6. Name each change explicitly (e.g. "white linen duvet replacing the red bedspread")
7. End with: "Same room layout and perspective as reference photo, professional interior photography, high resolution, warm natural lighting, magazine quality"

Write ONLY the image generation prompt. Start with "A redesigned [room type] with identical layout to the reference..."`
    : `You are an interior design expert. Analyze this room photo.

Write a detailed image generation prompt (5-7 sentences) showing it redesigned in ${style || styleContext || "modern minimalist"} style, keeping the EXACT same camera angle, room layout, and furniture positions.

Include: room type, every major furniture piece in its original position, new color scheme (${colorPalette || "warm neutrals"}), materials, lighting, decor accessories.
End with: "Same room layout and perspective as reference photo, professional interior photography, high resolution, warm natural lighting, magazine quality"
Write ONLY the prompt. Start with "A redesigned [room type] with identical layout to the reference..."`;

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
