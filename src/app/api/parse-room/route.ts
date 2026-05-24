import { NextRequest, NextResponse } from "next/server";
import { parseRoomInput } from "@/lib/room-code";

/**
 * GET — Parse SAIT-style room codes into building / floor / wing hints.
 *
 * Students type "CA416" or "NL1106" — not coordinates. This endpoint powers
 * autofill on the add form and filter sheet without a round-trip through the
 * full buildings list on the client.
 */
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
