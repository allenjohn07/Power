import { NextRequest, NextResponse } from "next/server";
import { parseRoomInput } from "@/lib/room-code";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const parsed = parseRoomInput(q);
  if (!parsed) {
    return NextResponse.json({ parsed: null });
  }

  return NextResponse.json({ parsed });
}
