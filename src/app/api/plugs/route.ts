import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  MAX_PLUG_PHOTOS,
  PLUG_IMAGE_INCLUDE,
  serializePlug,
} from "@/lib/plug-images";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-query";
import { applyPlugVote, getUserVotesForPlugs } from "@/lib/votes";

/** Fallback when contributors skip photos — keeps the feed visually consistent. */
const PLACEHOLDER =
  "https://placehold.co/120x120/e2e8f0/64748b?text=Plug";

/**
 * GET — Crowdsourced plug feed with optional relational filters.
 *
 * We model location as Building → floor → wing → exactLocation (text), not
 * PostGIS coordinates. Indoor GPS is unreliable on campus; a filterable relational
 * query is faster to ship, easier to vote on, and matches how students describe
 * outlets ("behind the vending machine near CA416").
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = request.nextUrl;
    const buildingId = searchParams.get("buildingId");
    const floor = searchParams.get("floor");
    const wing = searchParams.get("wing");
    const campus = searchParams.get("campus");

    const plugs = await withDbRetry(() =>
      prisma.plug.findMany({
        where: {
          ...(buildingId ? { buildingId: Number(buildingId) } : {}),
          ...(floor ? { floor } : {}),
          ...(wing ? { wing } : {}),
          ...(campus ? { building: { campus } } : {}),
        },
        include: PLUG_IMAGE_INCLUDE,
        orderBy: [{ building: { name: "asc" } }, { floor: "asc" }],
      }),
    );

    // Batch-load votes for the current page of plugs (avoids N+1 on the feed).
    const userVotes = session?.user?.id
      ? await getUserVotesForPlugs(
          session.user.id,
          plugs.map((p) => p.id),
        )
      : new Map();

    return NextResponse.json(
      plugs.map((plug) => serializePlug(plug, userVotes.get(plug.id) ?? null)),
    );
  } catch (error) {
    console.error("GET /api/plugs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugs" },
      { status: 500 },
    );
  }
}

/**
 * POST — Submit a new plug point (auth required).
 * Images are stored by URL after a separate upload step — keeps this handler
 * focused on relational integrity (building FK, floor, wing, micro-location).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sign in to add a plug." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { buildingId, floor, wing, exactLocation, imageUrls, imageUrl } =
      body;

    if (!buildingId || !floor?.trim() || !exactLocation?.trim()) {
      return NextResponse.json(
        { error: "buildingId, floor, and exactLocation are required" },
        { status: 400 },
      );
    }

    const urls: string[] = Array.isArray(imageUrls)
      ? imageUrls.filter((u: unknown) => typeof u === "string" && u.trim())
      : imageUrl?.trim()
        ? [imageUrl.trim()]
        : [];

    const uniqueUrls = [...new Set(urls as string[])].slice(0, MAX_PLUG_PHOTOS);
    const imageData =
      uniqueUrls.length > 0
        ? uniqueUrls.map((url, i) => ({ url, sortOrder: i }))
        : [{ url: PLACEHOLDER, sortOrder: 0 }];

    const plug = await prisma.plug.create({
      data: {
        buildingId: Number(buildingId),
        floor: floor.trim(),
        wing: wing?.trim() || null,
        exactLocation: exactLocation.trim(),
        submittedById: session.user.id,
        images: { create: imageData },
      },
      include: PLUG_IMAGE_INCLUDE,
    });

    return NextResponse.json(serializePlug(plug, null), { status: 201 });
  } catch (error) {
    console.error("POST /api/plugs error:", error);
    return NextResponse.json(
      { error: "Failed to create plug" },
      { status: 500 },
    );
  }
}

/**
 * PATCH — Toggle Works/Broken reliability vote (auth required).
 * Vote logic lives in applyPlugVote (transactional flip / undo / switch).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sign in to vote on plugs." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, vote } = body;

    if (!id || (vote !== "up" && vote !== "down")) {
      return NextResponse.json(
        { error: "id and vote ('up' | 'down') are required" },
        { status: 400 },
      );
    }

    const plugId = Number(id);
    const existingPlug = await prisma.plug.findUnique({ where: { id: plugId } });
    if (!existingPlug) {
      return NextResponse.json({ error: "Plug not found." }, { status: 404 });
    }

    const userVote = await applyPlugVote(session.user.id, plugId, vote);

    const plug = await prisma.plug.findUniqueOrThrow({
      where: { id: plugId },
      include: PLUG_IMAGE_INCLUDE,
    });

    return NextResponse.json(serializePlug(plug, userVote));
  } catch (error) {
    console.error("PATCH /api/plugs error:", error);
    return NextResponse.json(
      { error: "Failed to update vote" },
      { status: 500 },
    );
  }
}
