import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileEntries = formData.getAll("file");
    if (fileEntries.length === 0 || !fileEntries.every((f) => f instanceof Blob)) {
      return NextResponse.json({ error: "Missing 'file' in form data." }, { status: 400 });
    }
    const blobs = fileEntries as Blob[];
    for (const blob of blobs) {
      if (!ALLOWED_TYPES.has(blob.type)) {
        return NextResponse.json(
          { error: `Unsupported file type '${blob.type}'. Use PNG, JPEG, WEBP, GIF, or PDF.` },
          { status: 400 }
        );
      }
    }

    const files = await Promise.all(
      blobs.map(async (blob) => {
        const buffer = Buffer.from(await blob.arrayBuffer());
        return { mediaType: blob.type as never, base64Data: buffer.toString("base64") };
      })
    );

    const model = formData.get("model");
    const systemPrompt = formData.get("systemPrompt");
    const provider = getAiProvider(typeof model === "string" ? model : undefined);
    const result = await provider.extractMenu({
      files,
      systemPrompt: typeof systemPrompt === "string" ? systemPrompt : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during extraction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
