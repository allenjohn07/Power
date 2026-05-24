import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/lib/upload-image";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const imageUrl = await saveUploadedImage(file, "avatars");

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl },
      select: { imageUrl: true },
    });

    return NextResponse.json({ imageUrl: user.imageUrl });
  } catch (error) {
    console.error("POST /api/account/avatar error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
