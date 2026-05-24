import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Each image must be 5 MB or smaller");
  }
}

function buildFilename(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
}

async function saveToBlob(
  file: File,
  subdir: "plugs" | "avatars",
  filename: string,
): Promise<string> {
  const pathname = `${subdir}/${filename}`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function saveToLocalDisk(
  file: File,
  subdir: "plugs" | "avatars",
  filename: string,
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}

/**
 * Persist an outlet or avatar image. Uses Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set (production on Vercel); falls back to
 * public/uploads/ in local development without a token.
 */
export async function saveUploadedImage(
  file: File,
  subdir: "plugs" | "avatars",
): Promise<string> {
  validateImage(file);
  const filename = buildFilename(file);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return saveToBlob(file, subdir, filename);
  }

  if (process.env.NODE_ENV === "development") {
    return saveToLocalDisk(file, subdir, filename);
  }

  throw new Error(
    "Image uploads are not configured. Create a Vercel Blob store and set BLOB_READ_WRITE_TOKEN.",
  );
}
