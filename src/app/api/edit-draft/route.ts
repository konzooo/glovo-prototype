import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { EditDraftItem, PromptImageFile } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_REFERENCE_IMAGES = 4;

function isValidEditDraftItem(it: unknown): it is EditDraftItem {
  if (typeof it !== "object" || it === null) return false;
  const o = it as Record<string, unknown>;
  return (
    (typeof o.id === "string" || o.id === null) &&
    (typeof o.name === "string" || o.name === null) &&
    (typeof o.section === "string" || o.section === null) &&
    Array.isArray(o.dietary_tags)
  );
}

function parseItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readReferenceImages(formData: FormData): Promise<PromptImageFile[]> {
  const entries = formData.getAll("image");
  if (entries.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Attach at most ${MAX_REFERENCE_IMAGES} reference images.`);
  }

  const images: PromptImageFile[] = [];
  for (const entry of entries) {
    if (!(entry instanceof Blob)) {
      throw new Error("Invalid image attachment.");
    }
    if (!ALLOWED_IMAGE_TYPES.has(entry.type)) {
      throw new Error(`Unsupported image type '${entry.type}'. Use PNG, JPEG, WEBP, or GIF.`);
    }
    const buffer = Buffer.from(await entry.arrayBuffer());
    images.push({ mediaType: entry.type as PromptImageFile["mediaType"], base64Data: buffer.toString("base64") });
  }
  return images;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body = isMultipart ? null : await req.json();
    const formData = isMultipart ? await req.formData() : null;

    const instructionSource = formData?.get("prompt") ?? body?.prompt;
    const instruction = typeof instructionSource === "string" ? instructionSource.trim() : "";
    if (!instruction) {
      return NextResponse.json({ error: "Missing 'prompt'." }, { status: 400 });
    }

    const items = parseItems(formData?.get("items") ?? body?.items);
    if (items.length === 0) {
      return NextResponse.json({ error: "No items to edit." }, { status: 400 });
    }

    const systemPromptSource = formData?.get("systemPrompt") ?? body?.systemPrompt;
    const modelSource = formData?.get("model") ?? body?.model;
    const systemPrompt = typeof systemPromptSource === "string" ? systemPromptSource : undefined;
    const referenceImages = formData ? await readReferenceImages(formData) : [];
    const provider = getAiProvider(typeof modelSource === "string" ? modelSource : undefined);
    const resultItems = await provider.editDraft({ items: items as EditDraftItem[], instruction, referenceImages, systemPrompt });

    if (!Array.isArray(resultItems) || resultItems.length === 0 || !resultItems.every(isValidEditDraftItem)) {
      return NextResponse.json({ error: "Model returned an unusable list. Try rephrasing your instruction." }, { status: 502 });
    }

    return NextResponse.json({ items: resultItems });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error editing the draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
