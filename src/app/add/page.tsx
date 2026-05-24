"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  MultiPhotoUpload,
  type UploadedPhoto,
} from "@/components/MultiPhotoUpload";
import { RoomCodeAutofill } from "@/components/RoomCodeAutofill";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useCurrentBuilding } from "@/hooks/useCurrentBuilding";
import { MAX_PLUG_PHOTOS } from "@/lib/plug-images";

type Building = {
  id: number;
  code: string;
  name: string;
  campus: string;
  wingsList: string[];
  floorOptions: string[];
};

export default function AddPlugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { building: currentBuilding, ready: locationReady } =
    useCurrentBuilding();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [floor, setFloor] = useState("");
  const [wing, setWing] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/account");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/buildings?campus=main")
      .then((res) => res.json())
      .then((campusBuildings) => {
        if (!Array.isArray(campusBuildings)) return;
        setBuildings(campusBuildings);
        if (currentBuilding) {
          setBuildingId(String(currentBuilding.id));
        } else if (campusBuildings[0]) {
          setBuildingId(String(campusBuildings[0].id));
        }
      })
      .catch(() => setError("Could not load buildings."));
  }, [currentBuilding]);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => String(b.id) === buildingId),
    [buildings, buildingId],
  );

  const uploadOutletEvidencePhotos = async (files: FileList) => {
    const remaining = MAX_PLUG_PHOTOS - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      toUpload.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadPayload = await res.json();
      if (!res.ok) throw new Error(uploadPayload.error ?? "Upload failed");

      const newPhotos: UploadedPhoto[] = (uploadPayload.urls as string[]).map(
        (url: string, i: number) => ({
          url,
          preview: URL.createObjectURL(toUpload[i]),
        }),
      );
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PLUG_PHOTOS));
      toast.success(
        newPhotos.length === 1 ? "Photo added" : `${newPhotos.length} photos added`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeOutletEvidencePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const submitNewPlugPoint = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/plugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId: Number(buildingId),
          floor,
          wing: wing || undefined,
          exactLocation,
          imageUrls: photos.map((p) => p.url),
        }),
      });
      const createPayload = await res.json();
      if (res.status === 401) {
        router.replace("/account");
        return;
      }
      if (!res.ok) throw new Error(createPayload.error ?? "Failed to add plug");
      toast.success("Plug submitted!");
      router.push(`/?buildingId=${buildingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 pt-4 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Add a plug
        </h1>
        {locationReady && currentBuilding && (
          <p className="mt-1 text-sm text-muted-foreground">
            Adding near{" "}
            <span className="font-medium text-foreground">
              {currentBuilding.name}
            </span>{" "}
            — change building below if needed
          </p>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <form onSubmit={submitNewPlugPoint} className="flex flex-col gap-5">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {buildings.length > 0 && (
            <RoomCodeAutofill
              buildings={buildings}
              buildingId={buildingId}
              wing={wing}
              floor={floor}
              exactLocation={exactLocation}
              onBuildingIdChange={setBuildingId}
              onWingChange={setWing}
              onFloorChange={setFloor}
              onExactLocationChange={setExactLocation}
            />
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Building
            </span>
            <Select
              required
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setFloor("");
                setWing("");
              }}
            >
              {buildings.length === 0 ? (
                <option value="">Loading…</option>
              ) : (
                buildings.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.code} — {b.name}
                  </option>
                ))
              )}
            </Select>
          </label>

          {selectedBuilding && selectedBuilding.wingsList.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Wing (optional)
              </span>
              <Select
                value={wing}
                onChange={(e) => setWing(e.target.value)}
              >
                <option value="">No specific wing</option>
                {selectedBuilding.wingsList.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Floor
            </span>
            <Select
              required
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            >
              <option value="">Select floor</option>
              {(selectedBuilding?.floorOptions ?? []).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Micro-location
            </span>
            <textarea
              required
              rows={3}
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              placeholder="e.g. Behind the vending machine near room CA416"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <MultiPhotoUpload
            photos={photos}
            uploading={uploading}
            onAdd={uploadOutletEvidencePhotos}
            onRemove={removeOutletEvidencePhoto}
          />

          <Button
            type="submit"
            disabled={submitting || uploading || !buildingId || !floor}
            className="min-h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Submitting…" : "Submit plug"}
          </Button>
        </form>
      </main>
      </div>
    </AppShell>
  );
}
