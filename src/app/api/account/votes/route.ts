import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLUG_IMAGE_INCLUDE, serializePlug } from "@/lib/plug-images";
import { prisma } from "@/lib/prisma";
import { toClientVote } from "@/lib/votes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const votes = await prisma.plugVote.findMany({
      where: { userId: session.user.id },
      include: {
        plug: { include: PLUG_IMAGE_INCLUDE },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(
      votes.map(({ plug, vote }) =>
        serializePlug(plug, toClientVote(vote)),
      ),
    );
  } catch (error) {
    console.error("GET /api/account/votes error:", error);
    return NextResponse.json(
      { error: "Failed to load your votes." },
      { status: 500 },
    );
  }
}
