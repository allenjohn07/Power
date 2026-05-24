import { NextRequest, NextResponse } from "next/server";
import { MAX_PLUG_PHOTOS } from "@/lib/plug-images";
import { saveUploadedImage } from "@/lib/upload-image";

/**
 * POST — Persist outlet evidence photos to Vercel Blob (or local disk in dev).
 *
 * We accept multipart files here and return URLs for the plug POST handler.
 * Separating upload from creation avoids huge JSON bodies and keeps Prisma
 * transactions small — important on congested campus networks.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const outletPhotoFiles: File[] = [];

    const multi = formData.getAll("files");
    for (const entry of multi) {
      if (entry instanceof File && entry.size > 0) outletPhotoFiles.push(entry);
    }

    const single = formData.get("file");
    if (single instanceof File && single.size > 0) {
      outletPhotoFiles.push(single);
    }

    if (outletPhotoFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (outletPhotoFiles.length > MAX_PLUG_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PLUG_PHOTOS} photos per upload` },
        { status: 400 },
      );
    }

    const urls: string[] = [];
    for (const file of outletPhotoFiles) {
      urls.push(await saveUploadedImage(file, "plugs"));
    }

    return NextResponse.json({ urls, url: urls[0] });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
