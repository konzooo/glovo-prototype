import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing 'file' in form data." }, { status: 400 });
    }
    const mediaType = file.type;
    if (!ALLOWED_TYPES.has(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported file type '${mediaType}'. Use PNG, JPEG, WEBP, GIF, or PDF.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const model = formData.get("model");
    const systemPrompt = formData.get("systemPrompt");
    const provider = getAiProvider(typeof model === "string" ? model : undefined);
    const result = await provider.extractMenu({
      mediaType: mediaType as never,
      base64Data,
      systemPrompt: typeof systemPrompt === "string" ? systemPrompt : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during extraction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
