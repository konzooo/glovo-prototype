import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { BatchDescriptionItem } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

// Generates/enhances descriptions for many items in a single LLM call, so a "bulk edit"
// run costs at most one call per mode (create + enhance) instead of one call per item.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body?.mode === "enhance" ? "enhance" : "create";
    const rawItems = Array.isArray(body?.items) ? body.items : [];
    const items: BatchDescriptionItem[] = rawItems
      .filter((it: unknown): it is Record<string, unknown> => typeof it === "object" && it !== null)
      .map((it: Record<string, unknown>) => ({
        id: typeof it.id === "string" ? it.id : "",
        name: typeof it.name === "string" ? it.name : null,
        section: typeof it.section === "string" ? it.section : null,
        description: typeof it.description === "string" ? it.description : null,
      }))
      .filter((it: BatchDescriptionItem) => it.id);

    if (items.length === 0) {
      return NextResponse.json({ error: "No valid items provided." }, { status: 400 });
    }

    const systemPrompt = typeof body?.systemPrompt === "string" ? body.systemPrompt : undefined;
    const provider = getAiProvider(typeof body?.model === "string" ? body.model : undefined);
    const results = await provider.generateDescriptionsBatch({ mode, items, systemPrompt });

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating descriptions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
