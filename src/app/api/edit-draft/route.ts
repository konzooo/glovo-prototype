import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { EditDraftItem } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const instruction = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!instruction) {
      return NextResponse.json({ error: "Missing 'prompt'." }, { status: 400 });
    }
    const items = Array.isArray(body?.items) ? (body.items as unknown[]) : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "No items to edit." }, { status: 400 });
    }

    const systemPrompt = typeof body?.systemPrompt === "string" ? body.systemPrompt : undefined;
    const provider = getAiProvider(typeof body?.model === "string" ? body.model : undefined);
    const resultItems = await provider.editDraft({ items: items as EditDraftItem[], instruction, systemPrompt });

    if (!Array.isArray(resultItems) || resultItems.length === 0 || !resultItems.every(isValidEditDraftItem)) {
      return NextResponse.json({ error: "Model returned an unusable list. Try rephrasing your instruction." }, { status: 502 });
    }

    return NextResponse.json({ items: resultItems });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error editing the draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
