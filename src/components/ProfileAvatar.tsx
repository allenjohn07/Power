"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  username: string;
  imageUrl: string | null;
  onImageChange: (imageUrl: string) => void;
  size?: "md" | "lg";
};

export function ProfileAvatar({
  username,
  imageUrl,
  onImageChange,
  size = "lg",
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const dimension = size === "lg" ? "size-16" : "size-12";
  const iconSize = size === "lg" ? "size-6" : "size-5";

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onImageChange(data.imageUrl as string);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="relative">
        <div
          className={cn(
            dimension,
            "relative overflow-hidden rounded-full border border-border bg-muted",
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${username}'s profile`}
              fill
              className="object-cover"
              sizes={size === "lg" ? "64px" : "48px"}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className={cn(iconSize, "text-muted-foreground")} aria-hidden />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
          aria-label={imageUrl ? "Change profile photo" : "Upload profile photo"}
        >
          <Camera className="size-3.5" aria-hidden />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
