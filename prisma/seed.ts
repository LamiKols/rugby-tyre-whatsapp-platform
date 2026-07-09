import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../core/security/adminAuth.js";
import { tyreSeedData } from "../modules/tyres/seedData.js";

const prisma = new PrismaClient();

async function main() {
  const seedOwnerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  const seedOwnerPassword = process.env.SEED_OWNER_PASSWORD;
  const seedOwnerName = process.env.SEED_OWNER_NAME?.trim() || "Rugby Tyre Services Owner";

  if (seedOwnerEmail && seedOwnerPassword) {
    const existingOwner = await prisma.user.findUnique({
      where: { email: seedOwnerEmail }
    });

    if (!existingOwner) {
      await prisma.user.create({
        data: {
          name: seedOwnerName,
          email: seedOwnerEmail,
          password_hash: await hashPassword(seedOwnerPassword),
          role: "owner",
          active: true
        }
      });
    }
  }

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
