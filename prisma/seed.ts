import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { tyreSeedData } from "../modules/tyres/seedData.js";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-before-use";
  const password_hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "owner@rugbytyreservices.local" },
    update: {
      name: "Rugby Tyre Services Owner",
      password_hash,
      active: true
    },
    create: {
      name: "Rugby Tyre Services Owner",
      email: "owner@rugbytyreservices.local",
      password_hash,
      role: "owner",
      active: true
    }
  });

  for (const tyre of tyreSeedData) {
    await prisma.tyreCatalogue.upsert({
      where: {
        id: `${tyre.size}-${tyre.category}`.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()
      },
      update: tyre,
      create: {
        id: `${tyre.size}-${tyre.category}`.replace(/[^A-Za-z0-9]/g, "-").toLowerCase(),
        ...tyre
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

