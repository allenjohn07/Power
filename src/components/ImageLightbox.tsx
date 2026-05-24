"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ImageLightboxProps = {
  images: string[];
  alt: string;
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
};

export function ImageLightbox({
  images,
  alt,
  open,
  onClose,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (images.length > 1 && e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % images.length);
      }
      if (images.length > 1 && e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + images.length) % images.length);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, images.length]);

  if (!open || images.length === 0) return null;

  const src = images[index] ?? images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Plug photos"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur hover:bg-white/20"
        aria-label="Close gallery"
      >
        ×
      </button>

      {images.length > 1 && (
        <p className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </p>
      )}

      <div
        className="relative flex max-h-[80vh] w-full max-w-2xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + images.length) % images.length)
            }
            className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}

        <Image
          src={src}
          alt={`${alt} (${index + 1} of ${images.length})`}
          width={1200}
          height={900}
          className="mx-auto max-h-[80vh] w-auto rounded-lg object-contain"
          unoptimized
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            className="absolute right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
            aria-label="Next photo"
          >
            ›
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {images.map((thumb, i) => (
            <button
              key={thumb}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 ${
                i === index ? "border-white" : "border-transparent opacity-60"
              }`}
            >
              <Image
                src={thumb}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
