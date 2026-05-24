import { Prisma } from "@prisma/client";

export const MAX_PLUG_PHOTOS = 3;

export const PLUG_IMAGE_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" as const } },
  building: { select: { name: true, code: true, campus: true } },
  submittedBy: { select: { username: true } },
} satisfies Prisma.PlugInclude;

const PLACEHOLDER =
  "https://placehold.co/120x120/e2e8f0/64748b?text=Plug";

export type PlugImageDto = { id: number; url: string; sortOrder: number };

export type SerializedPlug = {
  id: number;
  buildingId: number;
  floor: string;
  wing: string | null;
  exactLocation: string;
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  submittedBy: string | null;
  building: { name: string; code: string; campus: string };
  images: PlugImageDto[];
  imageUrls: string[];
  /** First image — backward compatible */
  imageUrl: string;
};

export function serializePlug(
  plug: Prisma.PlugGetPayload<{ include: typeof PLUG_IMAGE_INCLUDE }>,
  userVote: "up" | "down" | null = null,
): SerializedPlug {
  const imageUrls =
    plug.images.length > 0
      ? plug.images.map((i) => i.url)
      : [PLACEHOLDER];

  return {
    id: plug.id,
    buildingId: plug.buildingId,
    floor: plug.floor,
    wing: plug.wing,
    exactLocation: plug.exactLocation,
    upvotes: plug.upvotes,
    downvotes: plug.downvotes,
    userVote,
    submittedBy: plug.submittedBy?.username ?? null,
    building: plug.building,
    images: plug.images.map((i) => ({
      id: i.id,
      url: i.url,
      sortOrder: i.sortOrder,
    })),
    imageUrls,
    imageUrl: imageUrls[0],
  };
}
