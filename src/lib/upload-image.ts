import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Write an uploaded outlet or avatar image under public/uploads/.
 * Local disk keeps the hackathon deploy simple (no S3 signing) and URLs stable
 * for Prisma PlugImage rows referenced by the relational feed.
 */
export async function saveUploadedImage(
  file: File,
  subdir: "plugs" | "avatars",
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Each image must be 5 MB or smaller");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}
