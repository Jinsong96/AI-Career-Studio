import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ llm: !!process.env.ANTHROPIC_API_KEY });
}
