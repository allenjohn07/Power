import { NextRequest, NextResponse } from "next/server";
import { MAX_PLUG_PHOTOS } from "@/lib/plug-images";
import { saveUploadedImage } from "@/lib/upload-image";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    const multi = formData.getAll("files");
    for (const entry of multi) {
      if (entry instanceof File && entry.size > 0) files.push(entry);
    }

    const single = formData.get("file");
    if (single instanceof File && single.size > 0) {
      files.push(single);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_PLUG_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PLUG_PHOTOS} photos per upload` },
        { status: 400 },
      );
    }

    const urls: string[] = [];
    for (const file of files) {
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

