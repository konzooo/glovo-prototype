import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name : "";
    if (!name.trim()) {
      return NextResponse.json({ error: "Missing 'name'." }, { status: 400 });
    }
    const section = typeof body?.section === "string" ? body.section : null;

    const provider = getAiProvider(typeof body?.model === "string" ? body.model : undefined);
    const description = await provider.generateDescription({ name, section });

    return NextResponse.json({ description });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
