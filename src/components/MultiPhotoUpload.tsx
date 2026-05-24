"use client";

import Image from "next/image";
import { MAX_PLUG_PHOTOS } from "@/lib/plug-images";
import { cn } from "@/lib/utils";

export type UploadedPhoto = {
  url: string;
  preview: string;
};

type MultiPhotoUploadProps = {
  photos: UploadedPhoto[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
};

export function MultiPhotoUpload({
  photos,
  uploading,
  onAdd,
  onRemove,
}: MultiPhotoUploadProps) {
  const atMax = photos.length >= MAX_PLUG_PHOTOS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Photos</span>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PLUG_PHOTOS} · help others find the spot
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div
            key={photo.url}
            className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <Image
              src={photo.preview}
              alt={`Photo ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-xs text-background transition-colors hover:bg-foreground/80"
              aria-label={`Remove photo ${i + 1}`}
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background">
                Cover
              </span>
            )}
          </div>
        ))}

        {!atMax && (
          <label
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card text-center transition-colors hover:bg-muted/80",
              uploading && "pointer-events-none opacity-50",
            )}
          >
            <span className="text-2xl text-muted-foreground">+</span>
            <span className="mt-1 px-1 text-[10px] text-muted-foreground">
              Add photo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.length) onAdd(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading photos…</p>
      )}
      {photos.length > 0 && !uploading && (
        <p className="text-xs text-emerald-800 dark:text-emerald-400">
          {photos.length} photo{photos.length === 1 ? "" : "s"} ready
        </p>
      )}
    </div>
  );
}
