import { PrismaClient } from "@prisma/client";
import { MAIN_CAMPUS_BUILDINGS } from "../src/data/sait-main-campus";

const prisma = new PrismaClient();

const PLACEHOLDER = "https://placehold.co/800x600/e2e8f0/64748b?text=Plug";

type SamplePlug = {
  code: string;
  floor: string;
  wing?: string;
  exactLocation: string;
  urls?: string[];
  upvotes?: number;
  downvotes?: number;
};

async function main() {
  await prisma.plugImage.deleteMany();
  await prisma.plug.deleteMany();
  await prisma.building.deleteMany();

  const buildings = await Promise.all(
    MAIN_CAMPUS_BUILDINGS.map((b) =>
      prisma.building.create({
        data: {
          code: b.code,
          name: b.name,
          campus: "main",
          mapSvgId: b.mapSvgId,
          maxFloor: b.maxFloor,
          wings: b.wings?.join(",") ?? null,
        },
      }),
    ),
  );

  const byCode = Object.fromEntries(buildings.map((b) => [b.code, b]));

  const samples: SamplePlug[] = [
    // Heritage Hall (A) — default building
    {
      code: "A",
      floor: "1st Floor",
      exactLocation: "Main corridor near Office of the Registrar",
      upvotes: 6,
      downvotes: 1,
    },
    {
      code: "A",
      floor: "2nd Floor",
      exactLocation: "North hallway lounge, outlet under bench seating",
      upvotes: 9,
      downvotes: 0,
    },

    // Stan Grad (M)
    {
      code: "M",
      floor: "2nd Floor",
      wing: "MB",
      exactLocation: "Reg Erhardt Library study carrels near east windows",
      upvotes: 12,
      downvotes: 1,
    },
    {
      code: "M",
      floor: "2nd Floor",
      wing: "MB",
      exactLocation: "MB wing hallway benches, outlet under seating",
      upvotes: 10,
      downvotes: 0,
    },
    {
      code: "M",
      floor: "Ground Floor",
      wing: "MC",
      exactLocation: "Food court seating, wall outlet by window",
      urls: [
        "https://placehold.co/800x600/e2e8f0/64748b?text=Outlet",
        "https://placehold.co/800x600/dbeafe/1e40af?text=Wide+view",
      ],
      upvotes: 15,
      downvotes: 0,
    },
    {
      code: "M",
      floor: "Ground Floor",
      wing: "MC",
      exactLocation: "MC commons tables, floor box outlet near pillar",
      upvotes: 11,
      downvotes: 1,
    },
    {
      code: "M",
      floor: "3rd Floor",
      wing: "MD",
      exactLocation: "MD computer lab row, wall outlet near door",
      upvotes: 7,
      downvotes: 0,
    },
    {
      code: "M",
      floor: "1st Floor",
      wing: "MD",
      exactLocation: "MD atrium tables, outlet on south wall",
      upvotes: 8,
      downvotes: 1,
    },

    // Senator Burns (N)
    {
      code: "N",
      floor: "3rd Floor",
      wing: "NL",
      exactLocation: "Hallway lounge, dual outlet under bench",
      upvotes: 8,
      downvotes: 2,
    },
    {
      code: "N",
      floor: "3rd Floor",
      wing: "NL",
      exactLocation: "NL corridor near elevators, bench outlet",
      upvotes: 5,
      downvotes: 0,
    },
    {
      code: "N",
      floor: "5th Floor",
      wing: "NH",
      exactLocation: "NH study area, dual USB outlet by window",
      upvotes: 6,
      downvotes: 1,
    },
    {
      code: "N",
      floor: "5th Floor",
      wing: "NH",
      exactLocation: "NH lounge seating, outlet under table ledge",
      upvotes: 4,
      downvotes: 0,
    },

    // EH Crandell (G) — map neighbor of Heritage Hall
    {
      code: "G",
      floor: "Ground Floor",
      exactLocation: "Main entrance lobby, outlet beside info desk",
      upvotes: 5,
      downvotes: 0,
    },
    {
      code: "G",
      floor: "2nd Floor",
      exactLocation: "Hallway study nook, wall outlet near seating",
      upvotes: 3,
      downvotes: 1,
    },

    // Johnson Cobbe (K) — map neighbor of Heritage Hall
    {
      code: "K",
      floor: "1st Floor",
      exactLocation: "Corridor seating alcove, outlet under bench",
      upvotes: 7,
      downvotes: 0,
    },
    {
      code: "K",
      floor: "3rd Floor",
      exactLocation: "Open study tables, floor box outlet near window",
      upvotes: 6,
      downvotes: 1,
    },

    // Green Building Tech (L) — map neighbor of Heritage Hall
    {
      code: "L",
      floor: "2nd Floor",
      exactLocation: "Lab hallway, outlet beside water fountain",
      upvotes: 4,
      downvotes: 0,
    },
    {
      code: "L",
      floor: "Ground Floor",
      exactLocation: "Atrium lounge chairs, outlet on partition wall",
      upvotes: 5,
      downvotes: 0,
    },

    // Thomas Riley (T)
    {
      code: "T",
      floor: "2nd Floor",
      wing: "TD",
      exactLocation: "TD wing lounge, outlet under window bench",
      upvotes: 9,
      downvotes: 0,
    },
    {
      code: "T",
      floor: "2nd Floor",
      wing: "TD",
      exactLocation: "TD corridor study tables, wall outlet",
      upvotes: 6,
      downvotes: 1,
    },
    {
      code: "T",
      floor: "1st Floor",
      wing: "TT",
      exactLocation: "TT commons, floor box outlet near entrance",
      upvotes: 5,
      downvotes: 0,
    },
    {
      code: "T",
      floor: "1st Floor",
      wing: "TT",
      exactLocation: "TT hallway seating, dual outlet under bench",
      upvotes: 4,
      downvotes: 0,
    },
  ];

  for (const s of samples) {
    const building = byCode[s.code];
    if (!building) {
      throw new Error(`Unknown building code in seed: ${s.code}`);
    }

    await prisma.plug.create({
      data: {
        buildingId: building.id,
        floor: s.floor,
        wing: s.wing ?? null,
        exactLocation: s.exactLocation,
        upvotes: s.upvotes ?? 0,
        downvotes: s.downvotes ?? 0,
        images: {
          create: (s.urls ?? [PLACEHOLDER]).map((url, sortOrder) => ({
            url,
            sortOrder,
          })),
        },
      },
    });
  }

  console.log(
    `Seeded ${buildings.length} buildings and ${samples.length} sample plugs.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
