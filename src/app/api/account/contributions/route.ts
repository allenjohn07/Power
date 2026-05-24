import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLUG_IMAGE_INCLUDE, serializePlug } from "@/lib/plug-images";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const plugs = await prisma.plug.findMany({
      where: { submittedById: session.user.id },
      include: PLUG_IMAGE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plugs.map((p) => serializePlug(p, null)));
  } catch (error) {
    console.error("GET /api/account/contributions error:", error);
    return NextResponse.json(
      { error: "Failed to load your contributions." },
      { status: 500 },
    );
  }
}
