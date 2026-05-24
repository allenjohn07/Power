import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  await prisma.plug.deleteMany();
  await prisma.building.deleteMany();
  console.log("Cleared plugs and buildings.");
  await prisma.$disconnect();
}

main();
