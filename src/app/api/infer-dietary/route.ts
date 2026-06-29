import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

// This route is the ONLY place an "inferred" dietary tag is ever produced — kept deliberately
// separate from /api/extract, which only ever returns tags visibly stated on the menu.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name : "";
    if (!name.trim()) {
      return NextResponse.json({ error: "Missing 'name'." }, { status: 400 });
    }
    const description = typeof body?.description === "string" ? body.description : null;
    const section = typeof body?.section === "string" ? body.section : null;

    const provider = getAiProvider(typeof body?.model === "string" ? body.model : undefined);
    const tags = await provider.inferDietaryTags({ name, description, section });

    return NextResponse.json({ tags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error inferring dietary tags.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
