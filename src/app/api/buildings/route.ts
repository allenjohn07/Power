import { NextRequest, NextResponse } from "next/server";
import { parseBuilding } from "@/lib/buildings";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-query";

export async function GET(request: NextRequest) {
  try {
    const campus = request.nextUrl.searchParams.get("campus");

    const buildings = await withDbRetry(() =>
      prisma.building.findMany({
        where: campus ? { campus } : undefined,
        orderBy: [{ campus: "asc" }, { name: "asc" }],
      }),
    );
    return NextResponse.json(buildings.map(parseBuilding));
  } catch (error) {
    console.error("GET /api/buildings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 },
    );
  }
}
